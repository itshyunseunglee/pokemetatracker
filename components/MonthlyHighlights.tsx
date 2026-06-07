import { getLatestMonth, getUsageStats, getAvailableMonths } from '@/lib/smogon'

function getPrevMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  const date = new Date(y, m - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthShort(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

interface Highlight {
  name: string
  change: number
  currentPct: number
  rank: number
}

export default async function MonthlyHighlights({ tier }: { tier: string }) {
  try {
    const months = await getAvailableMonths()
    const latestMonth = months[0]
    const prevMonth = months[1] ?? getPrevMonth(latestMonth ?? '')
    if (!latestMonth) return null

    const [current, prev] = await Promise.all([
      getUsageStats(latestMonth, tier).catch(() => []),
      getUsageStats(prevMonth, tier).catch(() => []),
    ])

    if (current.length === 0 || prev.length === 0) return null

    const changes = current.slice(0, 50).map((s) => {
      const prevEntry = prev.find((p) => p.name === s.name)
      if (!prevEntry) return null
      return {
        name: s.name,
        change: s.usagePercent - prevEntry.usagePercent,
        currentPct: s.usagePercent,
        rank: s.rank,
      }
    }).filter((x): x is Highlight => x !== null && Math.abs(x.change) > 0.05)

    if (changes.length === 0) return null

    const topGainer = [...changes].sort((a, b) => b.change - a.change)[0]
    const topLoser  = [...changes].sort((a, b) => a.change - b.change)[0]
    const mostUsed  = current[0]

    return (
      <div className="mb-8 rounded-xl border border-white/8 bg-[#13131c] p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          {tier.toUpperCase()} · {formatMonthShort(latestMonth)} vs {formatMonthShort(prevMonth)}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Most used */}
          <div className="flex items-center gap-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-4 py-3">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-xs text-slate-500 font-medium">Most Used</p>
              <p className="text-white font-bold">{mostUsed.name}</p>
              <p className="text-indigo-400 text-sm font-semibold">{mostUsed.usagePercent.toFixed(2)}%</p>
            </div>
          </div>

          {/* Biggest gainer */}
          {topGainer && (
            <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
              <span className="text-2xl">↑</span>
              <div>
                <p className="text-xs text-slate-500 font-medium">Biggest Gainer</p>
                <p className="text-white font-bold">{topGainer.name}</p>
                <p className="text-green-400 text-sm font-semibold">+{topGainer.change.toFixed(2)}%</p>
              </div>
            </div>
          )}

          {/* Biggest loser */}
          {topLoser && (
            <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <span className="text-2xl">↓</span>
              <div>
                <p className="text-xs text-slate-500 font-medium">Biggest Loser</p>
                <p className="text-white font-bold">{topLoser.name}</p>
                <p className="text-red-400 text-sm font-semibold">{topLoser.change.toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } catch {
    return null
  }
}
