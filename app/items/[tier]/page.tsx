import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLatestMonth, getAvailableTiers, getMovesetText, parseMovesetData, getUsageStats } from '@/lib/smogon'
import { formatTierName } from '@/constants/tierColors'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkeletonTable from '@/components/SkeletonTable'
import TierSelector from '@/components/TierSelector'
import ItemImage from '@/components/ItemImage'

export const revalidate = 86400

interface ItemsPageProps {
  params: Promise<{ tier: string }>
}

interface ItemEntry {
  name: string
  totalPercent: number
  count: number
  topPokemon: string
  topPokemonWeight: number
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

export async function generateMetadata({ params }: ItemsPageProps): Promise<Metadata> {
  const { tier } = await params
  const displayName = formatTierName(tier)
  const url = `https://pokemetatracker-psi.vercel.app/items/${tier}`
  return {
    title: `${displayName} Item Usage Rankings — Pokemon Showdown | PokeMetaTracker`,
    description: `Most-used held items in ${displayName} competitive Pokemon Showdown. Aggregate item rankings weighted by Pokemon usage. Updated monthly from Smogon stats.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayName} Item Usage Rankings — Pokemon Showdown | PokeMetaTracker`,
      description: `Most-used held items in ${displayName} competitive Pokemon Showdown. Aggregate item rankings weighted by Pokemon usage. Updated monthly from Smogon stats.`,
      url,
      images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
    },
  }
}

async function ItemsContent({ tier }: { tier: string }) {
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
  const itemMap = new Map<string, ItemEntry>()
  let totalWeight = 0
  const rawText = await getMovesetText(month, tier).catch(() => '')

  for (const pokemon of top50) {
    try {
      const movesetData = parseMovesetData(rawText, pokemon.name)
      if (!movesetData) continue
      const weight = pokemon.usagePercent / 100
      totalWeight += weight
      for (const item of movesetData.items) {
        const itemName = item.name.trim()
        if (!itemName || itemName === 'Nothing' || itemName === 'Other') continue
        const contribution = item.percent * weight
        const existing = itemMap.get(itemName)
        if (existing) {
          existing.totalPercent += contribution
          existing.count++
          if (contribution > existing.topPokemonWeight) {
            existing.topPokemon = pokemon.name
            existing.topPokemonWeight = contribution
          }
        } else {
          itemMap.set(itemName, { name: itemName, totalPercent: contribution, count: 1, topPokemon: pokemon.name, topPokemonWeight: contribution })
        }
      }
    } catch { /* skip */ }
  }

  const items = Array.from(itemMap.values())
    .map(e => ({ ...e, totalPercent: totalWeight > 0 ? Math.min(100, e.totalPercent / totalWeight) : 0 }))
    .sort((a, b) => b.totalPercent - a.totalPercent)
    .slice(0, 100)

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/3 p-10 text-center">
        <p className="text-slate-400 font-medium">No item data available for this tier.</p>
        <p className="text-slate-500 text-sm mt-2">Smogon may not publish moveset statistics for older or niche formats.</p>
      </div>
    )
  }

  const top5 = items.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Top 5 highlight */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {top5.map((item, i) => (
          <div key={item.name} className="rounded-xl bg-[#1a1a24] border border-white/6 p-4 text-center">
            <span className="text-slate-500 text-xs">#{i + 1}</span>
            <ItemImage name={item.name} size={40} />
            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
            <p className="text-amber-400 font-bold">{item.totalPercent.toFixed(2)}%</p>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="overflow-x-auto rounded-xl border border-white/6">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="bg-white/5 text-left">
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Rank</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Item</th>
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">
                Aggregate Usage %
                <span
                  title="Weighted average across the top 50 Pokemon by usage. Represents how often this item appears on a typical team in this tier."
                  className="ml-1 cursor-help text-slate-500 hover:text-slate-300"
                >ⓘ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 text-slate-400 font-mono text-sm">{i + 1}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ItemImage name={item.name} size={24} />
                    <span className="text-slate-100 font-medium">{item.name}</span>
                    {item.count === 1 && (
                      <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                        {item.topPokemon} only
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-amber-400 font-semibold">{item.totalPercent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function ItemsPage({ params }: ItemsPageProps) {
  const { tier } = await params
  const month = await getLatestMonth()
  const tiers = await getAvailableTiers(month)
  if (tiers.length > 0 && !tiers.includes(tier)) {
    notFound()
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Item Trends</h1>
      <p className="text-slate-400 mb-4">Most-used held items weighted by Pokemon usage. Select a tier to explore.</p>

      <TierSelector tiers={tiers} selectedTier={tier} basePath="/items" />

      <ErrorBoundary>
        <Suspense fallback={<SkeletonTable rows={20} />}>
          <ItemsContent tier={tier} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
