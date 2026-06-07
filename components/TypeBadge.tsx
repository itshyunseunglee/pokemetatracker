import { getTypeColor } from '@/constants/typeColors'

interface Props {
  type: string
  className?: string
}

export default function TypeBadge({ type, className = '' }: Props): React.JSX.Element {
  const color = getTypeColor(type)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white capitalize ${className}`}
      style={{ backgroundColor: color }}
    >
      {type}
    </span>
  )
}
