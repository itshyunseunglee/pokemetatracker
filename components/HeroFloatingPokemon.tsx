import { getLatestMonth, getUsageStats } from '@/lib/smogon'
import { normalizeSmogonName } from '@/lib/pokemon'
import FloatingSprite from './FloatingSprite'

function seededRng(seed: number): () => number {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = (s ^ (s >>> 16)) >>> 0
    return s / 0x100000000
  }
}

function pickDailyPokemon(names: string[], count: number): string[] {
  const today = new Date()
  const seed =
    today.getUTCFullYear() * 10000 +
    (today.getUTCMonth() + 1) * 100 +
    today.getUTCDate()
  const rng = seededRng(seed)
  const pool = [...names]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

const LAYOUTS = [
  { right: 30,  top: 20,  size: 155, anim: 'pokemon-float-delay-2', opacity: 0.72, glowColor: 'rgba(99,102,241,0.35)' },
  { right: 195, top: 40,  size: 110, anim: 'pokemon-float',          opacity: 0.58, glowColor: 'rgba(168,85,247,0.3)'  },
  { right: 10,  top: 210, size: 130, anim: 'pokemon-float-delay-1',  opacity: 0.65, glowColor: 'rgba(99,102,241,0.3)'  },
  { right: 185, top: 230, size: 95,  anim: 'pokemon-float-delay-3',  opacity: 0.52, glowColor: 'rgba(139,92,246,0.25)' },
  { right: 100, top: 130, size: 100, anim: 'pokemon-float-delay-4',  opacity: 0.55, glowColor: 'rgba(99,102,241,0.28)' },
]

export default async function HeroFloatingPokemon() {
  try {
    const month = await getLatestMonth()
    const stats = await getUsageStats(month, 'gen9ou').catch(() => [])
    if (stats.length < 10) return null

    const top50Names = stats.slice(0, 50).map((s) => s.name)
    const daily = pickDailyPokemon(top50Names, 5)

    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 hidden md:block select-none"
        style={{ width: 340, height: 400 }}
      >
        {daily.map((name, i) => {
          const l = LAYOUTS[i]
          const sprite = normalizeSmogonName(name)
          const urls = [
            `https://play.pokemonshowdown.com/sprites/dex/${sprite}.png`,
            `https://play.pokemonshowdown.com/sprites/gen5/${sprite}.png`,
            `https://play.pokemonshowdown.com/sprites/gen5ani/${sprite}.gif`,
          ]
          return (
            <FloatingSprite
              key={name}
              urls={urls}
              size={l.size}
              right={l.right}
              top={l.top}
              opacity={l.opacity}
              animClass={l.anim}
              glowColor={l.glowColor}
            />
          )
        })}
      </div>
    )
  } catch {
    return null
  }
}
