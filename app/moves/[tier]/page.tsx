import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLatestMonth, getAvailableTiers, getMovesetText, parseMovesetData, getUsageStats } from '@/lib/smogon'
import { getMoveType } from '@/constants/moveTypes'
import { getTypeColor } from '@/constants/typeColors'
import { formatTierName } from '@/constants/tierColors'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkeletonTable from '@/components/SkeletonTable'
import TierSelector from '@/components/TierSelector'

export const revalidate = 86400

interface MovesPageProps {
  params: Promise<{ tier: string }>
}

interface MoveEntry {
  name: string
  totalPercent: number
  count: number
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

export async function generateMetadata({ params }: MovesPageProps): Promise<Metadata> {
  const { tier } = await params
  const displayName = formatTierName(tier)
  const url = `https://pokemetatracker-psi.vercel.app/moves/${tier}`
  return {
    title: `${displayName} Move Usage Rankings — Pokemon Showdown | PokeMetaTracker`,
    description: `Most-used moves in ${displayName} competitive Pokemon Showdown. Aggregate move rankings weighted by Pokemon usage. Updated monthly from Smogon stats.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayName} Move Usage Rankings — Pokemon Showdown | PokeMetaTracker`,
      description: `Most-used moves in ${displayName} competitive Pokemon Showdown. Aggregate move rankings weighted by Pokemon usage. Updated monthly from Smogon stats.`,
      url,
      images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
    },
  }
}

function MoveBadge({ moveName }: { moveName: string }): React.JSX.Element {
  const type = getMoveType(moveName)
  if (!type) {
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-700 text-slate-300">—</span>
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white capitalize"
      style={{ backgroundColor: getTypeColor(type) }}
    >
      {type}
    </span>
  )
}

async function MovesContent({ tier }: { tier: string }) {
  const month = await getLatestMonth()
  const stats = await getUsageStats(month, tier).catch(() => [])

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-8 text-center">
        <p className="text-yellow-400">Data temporarily unavailable. Please try again later.</p>
      </div>
    )
  }

  const top50 = stats.slice(0, 50)
  const moveMap = new Map<string, MoveEntry>()
  let totalWeight = 0

  const rawText = await getMovesetText(month, tier).catch(() => '')
  for (const pokemon of top50) {
    try {
      const movesetData = parseMovesetData(rawText, pokemon.name)
      if (!movesetData) continue
      const weight = pokemon.usagePercent / 100
      totalWeight += weight
      for (const move of movesetData.moves) {
        const moveName = move.name.trim()
        if (!moveName || moveName === 'Other') continue
        const existing = moveMap.get(moveName)
        if (existing) {
          existing.totalPercent += move.percent * weight
          existing.count++
        } else {
          moveMap.set(moveName, { name: moveName, totalPercent: move.percent * weight, count: 1 })
        }
      }
    } catch { /* skip */ }
  }

  const moves = Array.from(moveMap.values())
    .map(e => ({ ...e, totalPercent: totalWeight > 0 ? Math.min(100, e.totalPercent / totalWeight) : 0 }))
    .sort((a, b) => b.totalPercent - a.totalPercent)
    .slice(0, 100)

  if (moves.length === 0) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/3 p-10 text-center">
        <p className="text-slate-400 font-medium">No moveset data available for this tier.</p>
        <p className="text-slate-500 text-sm mt-2">Smogon may not publish moveset statistics for older or niche formats.</p>
      </div>
    )
  }

  const top5 = moves.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Top 5 highlight */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {top5.map((move, i) => {
          const type = getMoveType(move.name)
          const typeColor = type ? getTypeColor(type) : '#374151'
          return (
            <div key={move.name} className="rounded-xl bg-[#1a1a24] border border-white/6 p-4 text-center">
              <span className="text-slate-500 text-xs">#{i + 1}</span>
              <p className="text-sm font-semibold text-white mt-1 truncate">{move.name}</p>
              {type && (
                <span
                  className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white capitalize"
                  style={{ backgroundColor: typeColor }}
                >
                  {type}
                </span>
              )}
              <p className="text-indigo-400 font-bold mt-1">{move.totalPercent.toFixed(2)}%</p>
            </div>
          )
        })}
      </div>

      {/* Full table */}
      <div className="overflow-x-auto rounded-xl border border-white/6">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="bg-white/5 text-left">
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Rank</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Move</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Type</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Weighted Usage %</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((move, i) => (
              <tr key={move.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 text-slate-400 font-mono text-sm">{i + 1}</td>
                <td className="py-2.5 px-4 text-slate-100 font-medium">{move.name}</td>
                <td className="py-2.5 px-4">
                  <MoveBadge moveName={move.name} />
                </td>
                <td className="py-2.5 px-4 text-indigo-400 font-semibold">{move.totalPercent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function MovesPage({ params }: MovesPageProps) {
  const { tier } = await params
  const month = await getLatestMonth()
  const tiers = await getAvailableTiers(month)
  if (tiers.length > 0 && !tiers.includes(tier)) {
    notFound()
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Move Trends</h1>
      <p className="text-slate-400 mb-4">Most-used moves weighted by Pokemon usage. Select a tier to explore.</p>

      <TierSelector tiers={tiers} selectedTier={tier} basePath="/moves" />

      <ErrorBoundary>
        <Suspense fallback={<SkeletonTable rows={20} />}>
          <MovesContent tier={tier} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
