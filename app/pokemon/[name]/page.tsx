import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getLatestMonth,
  getAvailableTiers,
  getUsageStats,
  getMovesetText,
  parseMovesetData,
  getAvailableMonths,
  getUsageMinElo,
} from '@/lib/smogon'
import { normalizeSmogonName, getPokemonImageUrls, pokemonData } from '@/lib/pokemon'
import TypeBadge from '@/components/TypeBadge'
import UsageBar from '@/components/UsageBar'
import ErrorBoundary from '@/components/ErrorBoundary'
import SmartPokemonImage from '@/components/SmartPokemonImage'
import CopyLinkButton from '@/components/CopyLinkButton'
import PokemonTrendSection from '@/components/PokemonTrendSection'

export const revalidate = 86400

interface PokemonPageProps {
  params: Promise<{ name: string }>
}

export async function generateStaticParams() {
  // Pre-render the entire Pokedex, not just top-usage mons — pages outside a
  // small "top N" list were falling through to per-request dynamic rendering,
  // which is what let a crawler walking the full dex alphabetically burn CPU.
  // Union with live Smogon usage names too, since those can carry suffixes
  // (e.g. Tera-active Ogerpon formes) that don't exist as PokeAPI dex entries.
  const names = new Set(Object.keys(pokemonData))
  try {
    const month = await getLatestMonth()
    const tiers = await getAvailableTiers(month)
    const tierStats = await Promise.all(tiers.map((t) => getUsageStats(month, t).catch(() => [])))
    for (const stats of tierStats) {
      for (const s of stats) names.add(normalizeSmogonName(s.name))
    }
  } catch {
    // fall back to Pokedex-only coverage
  }
  return Array.from(names).map((name) => ({ name }))
}

export async function generateMetadata({ params }: PokemonPageProps): Promise<Metadata> {
  const { name } = await params
  const displayName = name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const url = `https://pokemetatracker-psi.vercel.app/pokemon/${name}`
  return {
    title: `${displayName} Competitive Stats — Moveset, Items & Counters | PokeMetaTracker`,
    description: `${displayName} Smogon usage stats: best moveset, held items, EV spreads, teammates, and checks & counters in competitive Pokemon Showdown. Updated monthly.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayName} Competitive Stats — Moveset, Items & Counters | PokeMetaTracker`,
      description: `${displayName} Smogon usage stats: best moveset, held items, EV spreads, teammates, and checks & counters in competitive Pokemon Showdown. Updated monthly.`,
      url,
      images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
    },
  }
}

function StatBar({ label, value }: { label: string; value: number }) {
  const colors: Record<string, string> = {
    HP: '#ef4444', Atk: '#f97316', Def: '#eab308',
    SpA: '#6366f1', SpD: '#22c55e', Spe: '#ec4899',
  }
  const width = Math.min(100, (value / 255) * 100)
  const color = colors[label] ?? '#6366f1'
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 text-right text-sm font-semibold text-slate-200">{value}</span>
    </div>
  )
}

async function PokemonDetail({ name }: { name: string }) {
  const month = await getLatestMonth()
  const allMonths = await getAvailableMonths()
  const last6 = allMonths.slice(0, 6).reverse()
  const tiers = await getAvailableTiers(month)

  // Search all tiers in parallel — results are cached so this is fast
  const tierSearchResults = await Promise.all(
    tiers.map(async (tier) => {
      try {
        const stats = await getUsageStats(month, tier)
        const entry = stats.find((s) => normalizeSmogonName(s.name) === name)
        return entry ? { tier, smogonName: entry.name, usagePercent: entry.usagePercent, rank: entry.rank } : null
      } catch { return null }
    })
  )

  const allTierUsages = tierSearchResults
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map(({ tier, usagePercent, rank }) => ({ tier, usagePercent, rank }))
    .sort((a, b) => b.usagePercent - a.usagePercent)
  // Only show tiers with meaningful usage; always include at least the top tier
  const tierUsages = allTierUsages.filter((tu, i) => tu.usagePercent >= 0.05 || i === 0)

  // Use the first standard tier by priority order (tiers[] is already priority-ordered,
  // gen9ou first). Do NOT sort by usage: niche formats (e.g. gen9godlygift) can have
  // 100% usage but are wrong for moveset lookup. There's no per-request tier hint here
  // since this page is fully statically generated — see PokemonRowClient for why the
  // `?tier=` link param was dropped.
  const priorityMatch = tierSearchResults.find((r) => r !== null)
  const firstMatch = priorityMatch ?? null
  const smogonName = firstMatch?.smogonName ?? name
  const mainTier = firstMatch?.tier ?? tiers[0] ?? 'gen9ou'

  const [movesetResult, minElo] = await Promise.all([
    (async () => {
      try {
        const rawText = await getMovesetText(month, mainTier)
        return parseMovesetData(rawText, smogonName)
      } catch { return null }
    })(),
    getUsageMinElo(month, mainTier).catch(() => 0),
  ])
  const movesetData = movesetResult
  const pokeInfo = pokemonData[name] ?? pokemonData[name.split('-')[0]]
  const imageUrls = getPokemonImageUrls(name)
  const displayName = name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const GEN_TO_DEX: Record<number, string> = { 9:'sv', 8:'ss', 7:'sm', 6:'xy', 5:'bw', 4:'dp', 3:'rs', 2:'gs', 1:'rb' }
  const genNum = parseInt(mainTier.match(/^gen(\d)/)?.[1] ?? '9', 10)
  const smogonDex = GEN_TO_DEX[genNum] ?? 'sv'
  const mainTierUsage = tierUsages.find((tu) => tu.tier === mainTier) ?? tierUsages[0]

  if (tierUsages.length === 0 && !movesetData) {
    if (!pokeInfo) notFound()
    return (
      <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-8 text-center">
        <p className="text-yellow-400 font-medium">No competitive data available for this Pokemon.</p>
        <p className="text-slate-400 mt-2">{displayName} may not be present in current tier statistics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="flex-shrink-0">
            <SmartPokemonImage urls={imageUrls} alt={`${displayName} official artwork`} width={160} height={160} className="drop-shadow-2xl" priority />
          </div>
          <div className="flex-1 text-center sm:text-left">
            {pokeInfo && <p className="text-slate-500 text-sm mb-1">#{pokeInfo.id}</p>}
            <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
            {pokeInfo && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                {pokeInfo.types.map((t) => <TypeBadge key={t} type={t} />)}
              </div>
            )}
            {mainTierUsage && (
              <p className="text-slate-400 mb-4">
                Current usage in <span className="text-indigo-400 font-semibold">{mainTierUsage.tier}</span>:{' '}
                <span className="text-white font-bold text-xl">{mainTierUsage.usagePercent.toFixed(2)}%</span>
                {' '}(Rank #{mainTierUsage.rank})
                {minElo > 0 && (
                  <span className="ml-2 text-xs bg-white/8 text-slate-500 px-2 py-0.5 rounded-full align-middle">
                    Rating {minElo.toLocaleString()}+
                  </span>
                )}
              </p>
            )}
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <a
                href={`https://www.smogon.com/dex/${smogonDex}/pokemon/${name}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Smogon ↗
              </a>
              <a
                href={`https://play.pokemonshowdown.com/teambuilder`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/6 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/12 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
              >
                Showdown Teambuilder ↗
              </a>
              <CopyLinkButton />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {pokeInfo && (
          <ErrorBoundary>
            <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Base Stats</h2>
              <div className="space-y-2.5">
                <StatBar label="HP" value={pokeInfo.stats.hp} />
                <StatBar label="Atk" value={pokeInfo.stats.atk} />
                <StatBar label="Def" value={pokeInfo.stats.def} />
                <StatBar label="SpA" value={pokeInfo.stats.spa} />
                <StatBar label="SpD" value={pokeInfo.stats.spd} />
                <StatBar label="Spe" value={pokeInfo.stats.spe} />
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <span className="text-slate-400 text-sm">Total: </span>
                <span className="text-white font-bold">
                  {Object.values(pokeInfo.stats).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {tierUsages.length > 0 && (
          <ErrorBoundary>
            <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Usage by Tier</h2>
              <div className="space-y-3">
                {tierUsages.map((tu) => (
                  <div key={tu.tier} className="flex items-center gap-3">
                    <Link href={`/tier/${tu.tier}`} prefetch={false} className="w-28 text-xs text-indigo-400 hover:underline truncate focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                      {tu.tier}
                    </Link>
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, tu.usagePercent)}%` }} />
                    </div>
                    <span className="text-sm text-slate-300 w-14 text-right">{tu.usagePercent.toFixed(1)}%</span>
                    <span className="text-slate-500 text-xs">#{tu.rank}</span>
                  </div>
                ))}
              </div>
            </div>
          </ErrorBoundary>
        )}
      </div>

      {movesetData && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {movesetData.moves.length > 0 && (
            <ErrorBoundary>
              <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Top Moves</h2>
                <div className="space-y-2">
                  {movesetData.moves.slice(0, 5).map((m) => (
                    <UsageBar key={m.name} label={m.name} percent={m.percent} />
                  ))}
                </div>
              </div>
            </ErrorBoundary>
          )}

          {movesetData.items.length > 0 && (
            <ErrorBoundary>
              <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Top Items</h2>
                <div className="space-y-2">
                  {movesetData.items.slice(0, 5).map((item) => (
                    <UsageBar key={item.name} label={item.name} percent={item.percent} color="#f59e0b" />
                  ))}
                </div>
              </div>
            </ErrorBoundary>
          )}

          {movesetData.teammates.length > 0 && (
            <ErrorBoundary>
              <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Top Teammates</h2>
                <div className="space-y-2">
                  {movesetData.teammates.slice(0, 5).map((tm) => (
                    <Link key={tm.name} href={`/pokemon/${normalizeSmogonName(tm.name)}`} className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                      <UsageBar label={tm.name} percent={tm.percent} color="#10b981" />
                    </Link>
                  ))}
                </div>
              </div>
            </ErrorBoundary>
          )}

          {movesetData.spreads.length > 0 && (
            <ErrorBoundary>
              <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Common EV Spreads</h2>
                <div className="space-y-3">
                  {movesetData.spreads.slice(0, 3).map((s, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-medium">{s.nature}</span>
                        <span className="text-indigo-400 font-semibold">{s.percent.toFixed(1)}%</span>
                      </div>
                      <span className="text-slate-500 text-xs">{s.evs}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ErrorBoundary>
          )}

          {movesetData.counters.length > 0 && (
            <ErrorBoundary>
              <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6 sm:col-span-2">
                <h2 className="text-lg font-semibold text-white mb-4">Checks &amp; Counters</h2>
                <div className="space-y-2">
                  {movesetData.counters.slice(0, 5).map((c) => (
                    <div key={c.name} className="flex items-center gap-3 text-sm">
                      <Link href={`/pokemon/${normalizeSmogonName(c.name)}`} className="w-36 text-slate-300 hover:text-indigo-400 truncate focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                        {c.name}
                      </Link>
                      <span className="text-red-400 text-xs">KO: {c.koPercent.toFixed(1)}%</span>
                      <span className="text-blue-400 text-xs">Switch: {c.switchPercent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </ErrorBoundary>
          )}
        </div>
      )}

      {last6.length > 0 && (
        <ErrorBoundary>
          <PokemonTrendSection
            pokemonName={smogonName}
            displayName={displayName}
            tier={mainTier}
            months={last6}
          />
        </ErrorBoundary>
      )}
    </div>
  )
}

export default async function PokemonPage({ params }: PokemonPageProps) {
  const { name } = await params
  if (name !== name.toLowerCase()) notFound()

  // 404 for names that don't match any known Pokemon
  const namePokeInfo = pokemonData[name] ?? pokemonData[name.split('-')[0]]
  if (!namePokeInfo) notFound()

  const displayName = name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pokemetatracker-psi.vercel.app' },
      { '@type': 'ListItem', position: 2, name: displayName, item: `https://pokemetatracker-psi.vercel.app/pokemon/${name}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-48 rounded-xl bg-white/5" />
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-64 rounded-xl bg-white/5" />
                <div className="h-64 rounded-xl bg-white/5" />
              </div>
            </div>
          }
        >
          <PokemonDetail name={name.toLowerCase()} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
