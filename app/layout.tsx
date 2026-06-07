import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemetatracker-psi.vercel.app'
const OG_IMAGE = `${SITE_URL}/opengraph-image`

export const metadata: Metadata = {
  title: 'PokeMetaTracker - Pokemon Showdown Meta Statistics & Trends',
  description:
    'Track Pokemon Showdown competitive meta trends, usage stats, movesets, and tier rankings updated monthly from Smogon data.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'PokeMetaTracker - Pokemon Showdown Meta Statistics & Trends',
    description:
      'Track Pokemon Showdown competitive meta trends, usage stats, movesets, and tier rankings updated monthly from Smogon data.',
    type: 'website',
    url: SITE_URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'PokeMetaTracker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PokeMetaTracker - Pokemon Showdown Meta Statistics & Trends',
    description:
      'Track Pokemon Showdown competitive meta trends, usage stats, movesets, and tier rankings updated monthly from Smogon data.',
    images: [OG_IMAGE],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="fQmix3taVlm19n7yQShQpyXbd63iQ2u2IQykePVAF7w" />
      </head>
      <body className="min-h-screen bg-[#0f0f13] text-slate-100 antialiased overflow-x-hidden">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="border-t border-white/10 py-6 text-slate-500 text-sm">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p>
                PokeMetaTracker — Data sourced from{' '}
                <a href="https://smogon.com/stats/" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Smogon Usage Statistics
                </a>
              </p>
              <p className="mt-0.5">Not affiliated with Nintendo, Game Freak, or Smogon.</p>
            </div>
            <p className="text-slate-500 text-right">
              Made by{' '}
              <a
                href="https://www.linkedin.com/in/hyunseung--lee/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                Hyunseung Lee
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
