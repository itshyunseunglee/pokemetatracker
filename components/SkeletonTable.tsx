export default function SkeletonTable({ rows = 10 }: { rows?: number }): React.JSX.Element {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-10 bg-white/10 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-white/5 rounded-lg" />
      ))}
    </div>
  )
}
