interface Props {
  label: string
  percent: number
  color?: string
  maxPercent?: number
}

export default function UsageBar({ label, percent, color = '#6366f1', maxPercent = 100 }: Props): React.JSX.Element {
  const width = Math.min(100, (percent / maxPercent) * 100)

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 truncate text-sm text-slate-300">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-14 text-right text-sm font-medium text-slate-200">{percent.toFixed(1)}%</span>
    </div>
  )
}
