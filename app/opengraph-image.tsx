import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PokeMetaTracker — Pokemon Showdown Meta Statistics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function fetchSprite(url: string): Promise<string> {
  try {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) return ''
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)))
    }
    return `data:image/png;base64,${btoa(binary)}`
  } catch {
    return ''
  }
}

export default async function OGImage() {
  // Fetch sprites as base64 so satori doesn't need to make network calls during rendering
  const [greatTusk, gholdengo, dragonite, kingambit] = await Promise.all([
    fetchSprite('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/984.png'),
    fetchSprite('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1000.png'),
    fetchSprite('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png'),
    fetchSprite('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/983.png'),
  ])

  const hasSprites = greatTusk || gholdengo || dragonite || kingambit

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
        }}
      >
        {/* Top shimmer line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #6366f1, #a855f7, transparent)',
            display: 'flex',
          }}
        />

        {/* Soft indigo glow — top-right */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            display: 'flex',
          }}
        />

        {/* ── Left content ───────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '70px 64px',
            width: hasSprites ? 730 : 1200,
            zIndex: 1,
          }}
        >
          {/* Badge */}
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

          {/* Brand */}
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
            {([['1000+', 'Pokemon'], ['50+', 'Formats'], ['Monthly', 'Updates']] as [string, string][]).map(([val, label]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: 'white' }}>{val}</span>
                <span style={{ fontSize: 12, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right sprite panel (only if fetches succeeded) ── */}
        {hasSprites && (
          <div
            style={{
              display: 'flex',
              flex: 1,
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Divider */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 60,
                bottom: 60,
                width: 1,
                background: 'rgba(255,255,255,0.07)',
                display: 'flex',
              }}
            />

            {/* Great Tusk — center, largest */}
            {greatTusk && (
              <img
                src={greatTusk}
                width={200}
                height={200}
                style={{ position: 'absolute', bottom: 130, left: 50 }}
              />
            )}

            {/* Gholdengo — top right */}
            {gholdengo && (
              <img
                src={gholdengo}
                width={160}
                height={160}
                style={{ position: 'absolute', top: 50, right: 40, opacity: 0.85 }}
              />
            )}

            {/* Dragonite — bottom right */}
            {dragonite && (
              <img
                src={dragonite}
                width={145}
                height={145}
                style={{ position: 'absolute', bottom: 55, right: 38, opacity: 0.80 }}
              />
            )}

            {/* Kingambit — top left, behind */}
            {kingambit && (
              <img
                src={kingambit}
                width={125}
                height={125}
                style={{ position: 'absolute', top: 75, left: 35, opacity: 0.65 }}
              />
            )}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
