'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-8xl mb-6">⚡</div>
      <h1 className="text-3xl font-bold text-white mb-3">Something went wrong</h1>
      <p className="text-slate-400 mb-2">
        {error.message || 'An unexpected error occurred. Please refresh the page or try again later.'}
      </p>
      {error.digest && (
        <p className="text-slate-600 text-xs mb-6">Error ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
      >
        Try again
      </button>
    </div>
  )
}
