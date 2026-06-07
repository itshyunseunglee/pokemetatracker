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
  getMonthlyUsageForPokemon,
  getAvailableMonths,
} from '@/lib/smogon'
import { normalizeSmogonName, getPokemonImageUrls, pokemonData } from '@/lib/pokemon'
import TypeBadge from '@/components/TypeBadge'
import UsageBar from '@/components/UsageBar'
import ErrorBoundary from '@/components/ErrorBoundary'
import SmartPokemonImage from '@/components/SmartPokemonImage'
import CopyLinkButton from '@/components/CopyLinkButton'
import TrendChartWrapper from '@/app/trends/TrendChartWrapper'

export const revalidate = 86400

interface PokemonPageProps {
  params: Promise<{ name: string }>
}

export async function generateStaticParams() {
  try {
    const month = await getLatestMonth()
    const tiers = await getAvailableTiers(month)
    const mainTier = tiers[0] ?? 'gen9ou'
    const stats = await getUsageStats(month, mainTier)
    return stats.slice(0, 100).map((s) => ({ name: normalizeSmogonName(s.name) }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PokemonPageProps): Promise<Metadata> {
  const { name } = await params
  const displayName = name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const url = `https://pokemetatracker-psi.vercel.app/pokemon/${name}`
  return {
    title: `${displayName} Usage Stats, Movesets & Counters | PokeMetaTracker`,
    description: `${displayName} usage rate, top movesets, best items, teammates, and counters in Pokemon Showdown competitive play.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayName} Usage Stats, Movesets & Counters | PokeMetaTracker`,
      description: `${displayName} usage rate, top movesets, best items, teammates, and counters in Pokemon Showdown competitive play.`,
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

  const mainTier = tiers[0] ?? 'gen9ou'
  const mainStats = await getUsageStats(month, mainTier).catch(() => [])
  const smogonName = mainStats.find((s) => normalizeSmogonName(s.name) === name)?.name ?? name

  const tierUsages: { tier: string; usagePercent: number; rank: number }[] = []
  for (const tier of tiers.slice(0, 8)) {
    try {
      const stats = await getUsageStats(month, tier)
      const entry = stats.find((s) => normalizeSmogonName(s.name) === name)
      if (entry) tierUsages.push({ tier, usagePercent: entry.usagePercent, rank: entry.rank })
    } catch { /* skip */ }
  }

  let movesetData = null
  try {
    const rawText = await getMovesetText(month, mainTier)
    movesetData = parseMovesetData(rawText, smogonName)
  } catch { /* skip */ }

  const trendData = await getMonthlyUsageForPokemon(smogonName, mainTier, last6)
  const pokeInfo = pokemonData[name] ?? pokemonData[name.split('-')[0]]
  const imageUrls = getPokemonImageUrls(name)
  const displayName = name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  if (tierUsages.length === 0 && !movesetData) {
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
            {tierUsages.length > 0 && (
              <p className="text-slate-400 mb-4">
                Current usage in <span className="text-indigo-400 font-semibold">{tierUsages[0].tier}</span>:{' '}
                <span className="text-white font-bold text-xl">{tierUsages[0].usagePercent.toFixed(2)}%</span>
                {' '}(Rank #{tierUsages[0].rank})
              </p>
            )}
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <a
                href={`https://play.pokemonshowdown.com/teambuilder`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
                Open in Showdown
              </a>
              <a
                href={`https://www.smogon.com/dex/sv/pokemon/${name}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/6 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/12 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
              >
                Smogon Analysis ↗
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
                    <Link href={`/tier/${tu.tier}`} className="w-28 text-xs text-indigo-400 hover:underline truncate focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
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

      {trendData.length > 0 && (
        <ErrorBoundary>
          <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">6-Month Usage Trend</h2>
            <Suspense fallback={<div className="h-64 animate-pulse bg-white/5 rounded-lg" />}>
              <TrendChartWrapper series={[{ name: displayName, color: '#6366f1', data: trendData }]} />
            </Suspense>
          </div>
        </ErrorBoundary>
      )}
    </div>
  )
}

export default async function PokemonPage({ params }: PokemonPageProps) {
  const { name } = await params
  if (name !== name.toLowerCase()) notFound()

  return (
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
  )
}
