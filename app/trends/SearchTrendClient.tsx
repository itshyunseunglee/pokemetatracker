'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const TrendChart = dynamic(() => import('@/components/TrendChart'), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse bg-white/5 rounded-lg" />,
})

interface Series {
  name: string
  color: string
  data: { month: string; usagePercent: number }[]
}

interface Props {
  defaultSeries: Series[]
  allPokemonNames: string[]
  tier: string
  months: string[]
}

const CHART_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#84cc16',
]

export default function SearchTrendClient({ defaultSeries, allPokemonNames, tier, months }: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [matchedNames, setMatchedNames] = useState<string[]>([])
  const [chartSeries, setChartSeries] = useState<Series[]>(defaultSeries)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (!trimmed) {
      setChartSeries(defaultSeries)
      setMatchedNames([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      const lower = trimmed.toLowerCase()
      const matches = allPokemonNames.filter((n) => n.toLowerCase().includes(lower)).slice(0, 10)
      setMatchedNames(matches)

      if (matches.length === 0) {
        setChartSeries([])
        return
      }

      setLoading(true)
      try {
        // Fetch trend data via API route to avoid client-side Smogon calls
        const res = await fetch(
          `/api/trends?names=${encodeURIComponent(matches.join(','))}&tier=${encodeURIComponent(tier)}&months=${encodeURIComponent(months.join(','))}`
        )
        if (res.ok) {
          const data = (await res.json()) as { name: string; data: { month: string; usagePercent: number }[] }[]
          setChartSeries(data.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] })))
        }
      } catch {
        // On error, filter from defaultSeries
        const filtered = defaultSeries.filter((s) => s.name.toLowerCase().includes(lower))
        setChartSeries(filtered)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, defaultSeries, allPokemonNames, tier, months])

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Pokemon (e.g. Garchomp)..."
          className="w-full rounded-lg bg-white/10 border border-white/15 px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          aria-label="Search Pokemon for trend chart"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1 min-w-[32px] min-h-[32px] inline-flex items-center justify-center"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {query && matchedNames.length > 0 && (
        <p className="text-slate-500 text-xs">
          Showing trends for: {matchedNames.join(', ')}
        </p>
      )}
      {query && matchedNames.length === 0 && !loading && (
        <p className="text-slate-500 text-xs">No Pokemon found matching &quot;{query}&quot;</p>
      )}

      {/* Chart */}
      <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          {query ? 'Search Results' : 'Top 10 Usage Trends'} — Last 6 Months
        </h2>
        {loading ? (
          <div className="h-80 animate-pulse bg-white/5 rounded-lg flex items-center justify-center">
            <span className="text-slate-500 text-sm">Loading trend data...</span>
          </div>
        ) : chartSeries.length > 0 ? (
          <TrendChart series={chartSeries} height={320} />
        ) : (
          <div className="h-80 flex items-center justify-center">
            <p className="text-slate-500">No trend data available for this search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
