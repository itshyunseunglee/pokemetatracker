'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const TrendChart = dynamic(() => import('@/components/TrendChart'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-lg" />,
})

interface MonthlyUsage {
  month: string
  usagePercent: number
}

interface Props {
  pokemonName: string
  displayName: string
  tier: string
  months: string[]
}

export default function PokemonTrendSection({ pokemonName, displayName, tier, months }: Props) {
  const [data, setData] = useState<MonthlyUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!months.length) { setLoading(false); return }
    fetch(
      `/api/trends?names=${encodeURIComponent(pokemonName)}&tier=${encodeURIComponent(tier)}&months=${encodeURIComponent(months.join(','))}`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((res: { name: string; data: MonthlyUsage[] }[]) => {
        setData(res[0]?.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pokemonName, tier, months]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="h-64 animate-pulse bg-white/5 rounded-lg" />
  }

  if (!data.length) return null

  return (
    <TrendChart
      series={[{ name: displayName, color: '#6366f1', data }]}
      height={256}
    />
  )
}
