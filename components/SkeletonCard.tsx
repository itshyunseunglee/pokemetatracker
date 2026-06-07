export default function SkeletonCard(): React.JSX.Element {
  return (
    <div className="rounded-xl bg-[#1a1a24] border border-white/6 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-8 bg-white/10 rounded" />
        <div className="h-5 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="flex justify-center mb-3">
        <div className="h-24 w-24 bg-white/10 rounded-full" />
      </div>
      <div className="h-5 w-28 bg-white/10 rounded mx-auto mb-2" />
      <div className="h-4 w-20 bg-white/10 rounded mx-auto" />
    </div>
  )
}

export function SkeletonCardGrid({ count = 10 }: { count?: number }): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
