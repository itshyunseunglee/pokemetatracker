'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipContentProps,
} from 'recharts'

interface Series {
  name: string
  color: string
  data: { month: string; usagePercent: number }[]
}

interface Props {
  series: Series[]
  height?: number
}

interface ChartPoint {
  month: string
  [key: string]: number | string | null
}

function CustomTooltip({ active, payload, label }: TooltipContentProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null
  const validPayload = payload.filter((e) => e.value != null)
  if (validPayload.length === 0) return null
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a24] p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-2">{String(label ?? '')}</p>
      {validPayload.map((entry) => (
        <div key={String(entry.name)} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: String(entry.color ?? '#6366f1') }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-bold text-white">{Number(entry.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ series, height = 320 }: Props): React.JSX.Element {
  const monthSet = new Set<string>()
  for (const s of series) {
    for (const d of s.data) monthSet.add(d.month)
  }
  const months = Array.from(monthSet).sort()

  const chartData: ChartPoint[] = months.map((month) => {
    const point: ChartPoint = { month }
    for (const s of series) {
      const entry = s.data.find((d) => d.month === month)
      // null for missing months → Recharts renders a gap, not a zero
      point[s.name] = entry != null ? entry.usagePercent : null
    }
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip content={(props: TooltipContentProps) => <CustomTooltip {...props} />} />
        <Legend wrapperStyle={{ color: '#94a3b8', paddingTop: '12px' }} />
        {series.map((s) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 4, fill: s.color }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
