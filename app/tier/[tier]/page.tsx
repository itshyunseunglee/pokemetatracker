import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLatestMonth, getAvailableTiers, getUsageStats, getUsageMinElo } from '@/lib/smogon'
import { formatTierName, getTierColor, getTierDescription } from '@/constants/tierColors'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkeletonTable from '@/components/SkeletonTable'
import { PokemonRowClient } from '@/components/PokemonRowClient'
import TierSelector from '@/components/TierSelector'

export const revalidate = 86400

interface TierPageProps {
  params: Promise<{ tier: string }>
  searchParams: Promise<{ page?: string; view?: string; sort?: string }>
}

export async function generateStaticParams() {
  try {
    const month = await getLatestMonth()
    const tiers = await getAvailableTiers(month)
    return tiers.map((tier) => ({ tier }))
  } catch {
    return [
      { tier: 'gen9ou' }, { tier: 'gen9uu' }, { tier: 'gen9ubers' },
      { tier: 'gen9ru' }, { tier: 'gen9nu' }, { tier: 'gen9pu' },
    ]
  }
}

export async function generateMetadata({ params }: TierPageProps): Promise<Metadata> {
  const { tier } = await params
  const displayName = formatTierName(tier)
  const url = `https://pokemetatracker-psi.vercel.app/tier/${tier}`
  return {
    title: `${displayName} Tier Pokemon Usage Rankings | PokeMetaTracker`,
    description: `Full ${displayName} tier usage rankings from Smogon competitive Pokemon Showdown statistics.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayName} Tier Pokemon Usage Rankings | PokeMetaTracker`,
      description: `Full ${displayName} tier usage rankings from Smogon competitive Pokemon Showdown statistics.`,
      url,
      images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
    },
  }
}

const PAGE_SIZE = 50

function getPrevMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  const date = new Date(y, m - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function Pagination({
  page,
  totalPages,
  tier,
  view,
  sort,
}: {
  page: number
  totalPages: number
  tier: string
  view: string
  sort: string
}) {
  const pageCount = Math.min(totalPages, 7)
  const pages: number[] = []
  for (let i = 0; i < pageCount; i++) {
    if (totalPages <= 7) pages.push(i + 1)
    else if (page <= 4) pages.push(i + 1)
    else if (page >= totalPages - 3) pages.push(totalPages - 6 + i)
    else pages.push(page - 3 + i)
  }

  const href = (p: number) => `/tier/${tier}?page=${p}&view=${view}&sort=${sort}`

  return (
    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
      {page > 1 && (
        <a href={href(page - 1)} className="px-3 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 text-sm min-h-[44px] inline-flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
          ← Prev
        </a>
      )}
      {pages.map((p) => (
        <a
          key={p}
          href={href(p)}
          className={`px-3 py-2 rounded-lg text-sm min-h-[44px] inline-flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            p === page ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
          }`}
        >
          {p}
        </a>
      ))}
      {page < totalPages && (
        <a href={href(page + 1)} className="px-3 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 text-sm min-h-[44px] inline-flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
          Next →
        </a>
      )}
    </div>
  )
}

async function TierContent({
  tier,
  page,
  view,
  sort,
}: {
  tier: string
  page: number
  view: 'table' | 'card'
  sort: 'usage' | 'raw'
}) {
  const month = await getLatestMonth()
  const [stats, prevStats] = await Promise.all([
    getUsageStats(month, tier).catch(() => []),
    getUsageStats(getPrevMonth(month), tier).catch(() => []),
  ])

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-8 text-center">
        <p className="text-yellow-400 font-medium">Data temporarily unavailable. Please try again later.</p>
      </div>
    )
  }

  const sorted = sort === 'raw'
    ? [...stats].sort((a, b) => b.rawCount - a.rawCount)
    : stats

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function getRankChange(name: string, currentRank: number): number | 'NEW' {
    const prev = prevStats.find((s) => s.name === name)
    if (!prev) return 'NEW'
    return prev.rank - currentRank
  }

  if (view === 'card') {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {paginated.map((pokemon) => (
            <PokemonRowClient
              key={pokemon.name}
              rank={sort === 'raw' ? paginated.indexOf(pokemon) + (page - 1) * PAGE_SIZE + 1 : pokemon.rank}
              name={pokemon.name}
              usagePercent={pokemon.usagePercent}
              rawCount={pokemon.rawCount}
              rankChange={getRankChange(pokemon.name, pokemon.rank)}
              view="card"
            />
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} tier={tier} view={view} sort={sort} />
      </>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/6">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-white/5 text-left">
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Rank</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Pokemon</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Usage %</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Raw Count</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((pokemon, idx) => (
              <PokemonRowClient
                key={pokemon.name}
                rank={sort === 'raw' ? idx + (page - 1) * PAGE_SIZE + 1 : pokemon.rank}
                name={pokemon.name}
                usagePercent={pokemon.usagePercent}
                rawCount={pokemon.rawCount}
                rankChange={getRankChange(pokemon.name, pokemon.rank)}
                view="table"
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} tier={tier} view={view} sort={sort} />
    </>
  )
}

export default async function TierPage({ params, searchParams }: TierPageProps) {
  const { tier } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const view = sp.view === 'card' ? 'card' : 'table'
  const sort = sp.sort === 'raw' ? 'raw' : 'usage'

  const month = await getLatestMonth()
  const [tiers, minElo] = await Promise.all([
    getAvailableTiers(month),
    getUsageMinElo(month, tier).catch(() => 0),
  ])
  if (tiers.length > 0 && !tiers.includes(tier)) {
    notFound()
  }

  const displayName = formatTierName(tier)
  const color = getTierColor(tier)
  const description = getTierDescription(tier)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${displayName} Pokemon Usage Rankings`,
    description,
    url: `https://pokemetatracker-psi.vercel.app/tier/${tier}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
          <h1 className="text-3xl font-bold text-white">{displayName}</h1>
        </div>
        <p className="text-slate-400 max-w-2xl">{description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-slate-500">{month} data</span>
          {minElo > 0 && (
            <span className="text-xs bg-white/8 text-slate-400 px-2 py-0.5 rounded-full">
              Elo {minElo.toLocaleString()}+
            </span>
          )}
        </div>
      </div>

      <TierSelector tiers={tiers} selectedTier={tier} basePath="/tier" />

      {/* Controls: view toggle + sort */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          <a href={`/tier/${tier}?page=1&view=table&sort=${sort}`} className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${view === 'table' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Table View
          </a>
          <a href={`/tier/${tier}?page=1&view=card&sort=${sort}`} className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${view === 'card' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Card View
          </a>
        </div>

        <div className="flex gap-2 ml-auto">
          <span className="text-slate-500 text-sm self-center">Sort:</span>
          <a href={`/tier/${tier}?page=1&view=${view}&sort=usage`} className={`px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${sort === 'usage' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Usage %
          </a>
          <a href={`/tier/${tier}?page=1&view=${view}&sort=raw`} className={`px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${sort === 'raw' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Raw Count
          </a>
        </div>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<SkeletonTable rows={50} />}>
          <TierContent tier={tier} page={page} view={view} sort={sort} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
