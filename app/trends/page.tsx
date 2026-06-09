import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { getLatestMonth, getAvailableTiers, getUsageStats, getAvailableMonths } from '@/lib/smogon'
import ErrorBoundary from '@/components/ErrorBoundary'
import TierSelector from '@/components/TierSelector'

const SearchTrendClient = dynamic(() => import('./SearchTrendClient'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search Pokemon (e.g. Garchomp)..."
        disabled
        className="w-full rounded-lg bg-white/10 border border-white/15 px-4 py-3 text-slate-100 placeholder-slate-500 text-sm min-h-[44px] opacity-60 cursor-not-allowed"
        aria-label="Search Pokemon for trend chart"
      />
      <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
        <div className="h-80 animate-pulse bg-white/5 rounded-lg" />
      </div>
    </div>
  ),
})

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Pokemon Usage Trends — Competitive Meta History | PokeMetaTracker',
  description: 'Track Pokemon usage trend changes over time in competitive Pokemon Showdown. View 6-month usage history by tier — OU, UU, Ubers, and more. Based on Smogon monthly stats.',
  alternates: { canonical: 'https://pokemetatracker-psi.vercel.app/trends' },
  openGraph: {
    title: 'Pokemon Usage Trends — Competitive Meta History | PokeMetaTracker',
    description: 'Track Pokemon usage trend changes over time in competitive Pokemon Showdown. View 6-month usage history by tier — OU, UU, Ubers, and more. Based on Smogon monthly stats.',
    url: 'https://pokemetatracker-psi.vercel.app/trends',
    images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
  },
}

interface TrendsPageProps {
  searchParams: Promise<{ tier?: string }>
}

async function TrendsContent({ tier }: { tier: string }) {
  // Parallel: fetch months list + latest month probe simultaneously
  const [allMonths, latestMonthFallback] = await Promise.all([
    getAvailableMonths(),
    getLatestMonth(),
  ])

  const last6Months = allMonths.slice(0, 6).reverse()
  const latestMonth = allMonths[0] ?? latestMonthFallback
  const prevMonth = allMonths[1] ?? latestMonth

  // Parallel: fetch both months' stats simultaneously
  const [latestStats, prevStats] = await Promise.all([
    getUsageStats(latestMonth, tier).catch(() => []),
    getUsageStats(prevMonth, tier).catch(() => []),
  ])

  const top10Names = latestStats.slice(0, 10).map((s) => s.name)
  const allNames = latestStats.map((s) => s.name)

  // Rising / Falling (server-computed, no heavy trend fetch needed)
  const changes = latestStats.slice(0, 50).map((s) => {
    const prev = prevStats.find((p) => p.name === s.name)
    return { name: s.name, change: s.usagePercent - (prev?.usagePercent ?? 0) }
  })
  const rising = [...changes].sort((a, b) => b.change - a.change).slice(0, 5)
  const falling = [...changes].sort((a, b) => a.change - b.change).slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Search + Chart — rendered client-side only to avoid server timeout */}
      <ErrorBoundary>
        <SearchTrendClient
          initialNames={top10Names}
          allPokemonNames={allNames}
          tier={tier}
          months={last6Months}
        />
      </ErrorBoundary>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Rising */}
        <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
          <h3 className="text-base font-semibold text-green-400 mb-4">↑ Rising This Month (Top 5)</h3>
          <div className="space-y-3">
            {rising.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{item.name}</span>
                <span className="text-green-400 font-semibold text-sm">+{item.change.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Falling */}
        <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
          <h3 className="text-base font-semibold text-red-400 mb-4">↓ Falling This Month (Top 5)</h3>
          <div className="space-y-3">
            {falling.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{item.name}</span>
                <span className="text-red-400 font-semibold text-sm">{item.change.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function TrendsPage({ searchParams }: TrendsPageProps) {
  const params = await searchParams
  const latestMonth = await getLatestMonth()
  const tiers = await getAvailableTiers(latestMonth)
  const tier = params.tier && tiers.includes(params.tier) ? params.tier : tiers[0] ?? 'gen9ou'

  return (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Meta Trends</h1>
      <p className="text-slate-400 mb-4">Track how Pokemon usage changes month over month. Search any Pokemon to see its trend.</p>

      <TierSelector tiers={tiers} selectedTier={tier} basePath="/trends" />

      <ErrorBoundary>
        <Suspense fallback={<div className="h-96 animate-pulse bg-white/5 rounded-xl" />}>
          <TrendsContent tier={tier} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
