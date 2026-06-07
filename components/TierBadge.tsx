import { getTierColor, formatTierName } from '@/constants/tierColors'

interface Props {
  tier: string
  className?: string
}

export default function TierBadge({ tier, className = '' }: Props): React.JSX.Element {
  const color = getTierColor(tier)
  const label = formatTierName(tier)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}
