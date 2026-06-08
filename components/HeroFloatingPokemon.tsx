import { getLatestMonth, getUsageStats } from '@/lib/smogon'
import { getPokemonImageUrls } from '@/lib/pokemon'
import FloatingSprite from './FloatingSprite'

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
    if (stats.length < 5) return null

    const top5 = stats.slice(0, 5).map((s) => s.name)

    return (
      <div
        aria-hidden="true"
        className="pointer-events-none relative flex-shrink-0 select-none"
        style={{ width: 340, height: 400 }}
      >
        {top5.map((name, i) => {
          const l = LAYOUTS[i]
          return (
            <FloatingSprite
              key={name}
              urls={getPokemonImageUrls(name)}
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
