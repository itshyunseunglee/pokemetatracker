import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | PokeMetaTracker',
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-8xl mb-6">🎯</div>
      <h1 className="text-4xl font-bold text-white mb-3">404</h1>
      <p className="text-xl text-slate-300 mb-2">Looks like this page fled the battle!</p>
      <p className="text-slate-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
      >
        ← Head back to the home page
      </Link>
    </div>
  )
}
