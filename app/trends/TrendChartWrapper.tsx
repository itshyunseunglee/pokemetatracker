'use client'

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

export default function TrendChartWrapper({ series }: { series: Series[] }) {
  return <TrendChart series={series} height={320} />
}
