import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PokeMetaTracker — Pokemon Showdown Meta Statistics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Sprite URLs — PokeAPI official artwork, always 200
const SPRITES = {
  greatTusk:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/984.png',
  gholdengo:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1000.png',
  kingambit:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/983.png',
  dragonite:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png',
}

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0d0d18 0%, #0f0f1c 55%, #0a0a14 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Indigo glow orb behind sprites */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0) 70%)',
            display: 'flex',
          }}
        />

        {/* ── Left content column ─────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '70px 64px',
            flex: 1,
            zIndex: 1,
          }}
        >
          {/* Live badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(99,102,241,0.18)',
              border: '1.5px solid rgba(99,102,241,0.40)',
              borderRadius: 999,
              padding: '9px 22px',
              marginBottom: 32,
              width: 'fit-content',
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#818cf8',
                display: 'flex',
              }}
            />
            <span
              style={{
                color: '#818cf8',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              LIVE SMOGON DATA
            </span>
          </div>

          {/* Logo + title */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 18 }}>
            <span
              style={{
                fontSize: 62,
                fontWeight: 900,
                color: '#818cf8',
                lineHeight: 1.08,
                letterSpacing: '-0.01em',
              }}
            >
              PokeMetaTracker
            </span>
            <span
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.25,
                marginTop: 10,
              }}
            >
              Pokemon Showdown
            </span>
            <span
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.25,
              }}
            >
              Meta Statistics
            </span>
          </div>

          {/* Subtitle */}
          <span
            style={{
              fontSize: 19,
              color: '#94a3b8',
              lineHeight: 1.5,
              marginBottom: 44,
              maxWidth: 520,
            }}
          >
            Real-time usage stats · Move &amp; Item trends · Gen 1–9 coverage
          </span>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: 44,
              paddingTop: 28,
              borderTop: '1.5px solid rgba(255,255,255,0.09)',
            }}
          >
            {[
              ['1000+', 'Pokemon'],
              ['50+', 'Formats'],
              ['Monthly', 'Updates'],
            ].map(([val, label]) => (
              <div
                key={label}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <span
                  style={{ fontSize: 30, fontWeight: 900, color: 'white' }}
                >
                  {val}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right sprite panel ─────────────────────────── */}
        <div
          style={{
            width: 420,
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* Subtle divider */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 60,
              bottom: 60,
              width: 1,
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
            }}
          />

          {/* Great Tusk — center-left, large */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPRITES.greatTusk}
            width={210}
            height={210}
            style={{
              position: 'absolute',
              bottom: 120,
              left: 40,
            }}
          />

          {/* Gholdengo — top-right */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPRITES.gholdengo}
            width={165}
            height={165}
            style={{
              position: 'absolute',
              top: 55,
              right: 30,
              opacity: 0.88,
            }}
          />

          {/* Dragonite — bottom-right */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPRITES.dragonite}
            width={148}
            height={148}
            style={{
              position: 'absolute',
              bottom: 55,
              right: 28,
              opacity: 0.80,
            }}
          />

          {/* Kingambit — top-left, partially behind others */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPRITES.kingambit}
            width={130}
            height={130}
            style={{
              position: 'absolute',
              top: 70,
              left: 30,
              opacity: 0.70,
            }}
          />
        </div>

        {/* Top shimmer line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 40%, rgba(168,85,247,0.5) 70%, transparent 100%)',
            display: 'flex',
          }}
        />

        {/* Bottom shimmer line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
