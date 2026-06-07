import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getLatestMonth, getAvailableTiers, getMovesetText, parseMovesetData, getUsageStats } from '@/lib/smogon'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkeletonTable from '@/components/SkeletonTable'
import TierSelector from '@/components/TierSelector'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Item Trends - Pokemon Showdown Usage | PokeMetaTracker',
  description: 'Top held item usage rankings in competitive Pokemon Showdown, filtered by tier.',
  alternates: { canonical: 'https://pokemetatracker-psi.vercel.app/items' },
  openGraph: {
    title: 'Item Trends - Pokemon Showdown Usage | PokeMetaTracker',
    description: 'Top held item usage rankings in competitive Pokemon Showdown, filtered by tier.',
    url: 'https://pokemetatracker-psi.vercel.app/items',
    images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
  },
}

interface ItemsPageProps {
  searchParams: Promise<{ tier?: string }>
}

interface ItemEntry {
  name: string
  totalPercent: number
  count: number
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
        const existing = itemMap.get(itemName)
        if (existing) {
          existing.totalPercent += item.percent * weight
          existing.count++
        } else {
          itemMap.set(itemName, { name: itemName, totalPercent: item.percent * weight, count: 1 })
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

  function itemIconUrl(name: string): string {
    return `https://www.smogon.com/dex/media/items/${name.toLowerCase().replace(/\s+/g, '-')}.png`
  }

  return (
    <div className="space-y-8">
      {/* Top 5 highlight */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {top5.map((item, i) => (
          <div key={item.name} className="rounded-xl bg-[#1a1a24] border border-white/6 p-4 text-center">
            <span className="text-slate-500 text-xs">#{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={itemIconUrl(item.name)}
              alt=""
              width={40}
              height={40}
              className="mx-auto my-2 w-10 h-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
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
              <th className="py-3 px-4 text-slate-400 text-sm font-semibold">Aggregate Usage %</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 text-slate-400 font-mono text-sm">{i + 1}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={itemIconUrl(item.name)}
                      alt=""
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span className="text-slate-100 font-medium">{item.name}</span>
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

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const params = await searchParams
  const month = await getLatestMonth()
  const tiers = await getAvailableTiers(month)
  const tier = params.tier && tiers.includes(params.tier) ? params.tier : tiers[0] ?? 'gen9ou'

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
