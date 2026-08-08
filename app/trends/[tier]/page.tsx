import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { getLatestMonth, getAvailableTiers, getUsageStats, getAvailableMonths } from '@/lib/smogon'
import { formatTierName } from '@/constants/tierColors'
import ErrorBoundary from '@/components/ErrorBoundary'
import TierSelector from '@/components/TierSelector'

const SearchTrendClient = dynamic(() => import('../SearchTrendClient'), {
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

interface TrendsPageProps {
  params: Promise<{ tier: string }>
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

export async function generateMetadata({ params }: TrendsPageProps): Promise<Metadata> {
  const { tier } = await params
  const displayName = formatTierName(tier)
  const url = `https://pokemetatracker-psi.vercel.app/trends/${tier}`
  return {
    title: `${displayName} Usage Trends — Competitive Meta History | PokeMetaTracker`,
    description: `Track Pokemon usage trend changes over time in ${displayName} competitive Pokemon Showdown. View 6-month usage history. Based on Smogon monthly stats.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayName} Usage Trends — Competitive Meta History | PokeMetaTracker`,
      description: `Track Pokemon usage trend changes over time in ${displayName} competitive Pokemon Showdown. View 6-month usage history. Based on Smogon monthly stats.`,
      url,
      images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
    },
  }
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

export default async function TrendsPage({ params }: TrendsPageProps) {
  const { tier } = await params
  const latestMonth = await getLatestMonth()
  const tiers = await getAvailableTiers(latestMonth)
  if (tiers.length > 0 && !tiers.includes(tier)) {
    notFound()
  }

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
