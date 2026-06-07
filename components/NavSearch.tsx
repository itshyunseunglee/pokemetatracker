'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import pokemonDataRaw from '@/lib/pokemon-data.json'

const ALL_NAMES: string[] = Object.keys(pokemonDataRaw)

function toDisplay(name: string): string {
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function NavSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [selected, setSelected] = useState(-1)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const router = useRouter()

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults([]); return }
    const lower = q.toLowerCase().replace(/\s+/g, '-')
    const matches = ALL_NAMES.filter((n) => n.includes(lower)).slice(0, 8)
    setResults(matches)
    setSelected(-1)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  function navigate(name: string) {
    router.push(`/pokemon/${name}`)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, -1))
    } else if (e.key === 'Enter') {
      if (selected >= 0 && results[selected]) navigate(results[selected])
      else if (results[0]) navigate(results[0])
    } else if (e.key === 'Escape') {
      setQuery('')
      setResults([])
      setOpen(false)
    }
  }

  const showDropdown = open && results.length > 0

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative flex items-center">
        <svg className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search Pokemon…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onKeyDown={handleKey}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-40 lg:w-52 bg-white/8 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:w-56 lg:focus:w-64 transition-all duration-200"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute top-full right-0 mt-1.5 w-56 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          {results.map((name, i) => (
            <li key={name}>
              <button
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                  i === selected ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`}
                onMouseDown={() => navigate(name)}
                onMouseEnter={() => setSelected(i)}
              >
                <span className="text-slate-500 font-mono text-xs w-4 text-right shrink-0">{i + 1}</span>
                <span className="truncate">{toDisplay(name)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
