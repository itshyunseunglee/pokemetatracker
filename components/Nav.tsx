'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import NavSearch from './NavSearch'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/trends', label: 'Meta Trends' },
  { href: '/tier', label: 'Tier Rankings' },
  { href: '/moves', label: 'Move Trends' },
  { href: '/items', label: 'Item Trends' },
]

export default function Nav(): React.JSX.Element {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f13]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
          <span>PokeMetaTracker</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex list-none items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] inline-flex items-center ${
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('/').slice(0, 2).join('/')))
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <NavSearch />
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 min-w-[44px] min-h-[44px] items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className={`block h-0.5 w-6 bg-slate-300 transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-slate-300 transition-all ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-slate-300 transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {/* Mobile search */}
          <div className="mb-2">
            <NavSearch />
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] flex items-center ${
                pathname === link.href
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
