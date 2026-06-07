import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PokeMetaTracker — Pokemon Showdown Meta Statistics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0d0d16 0%, #0f0f1c 60%, #0a0a12 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: 999,
            padding: '8px 20px',
            marginBottom: 36,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', display: 'flex' }} />
          <span style={{ color: '#818cf8', fontSize: 16, fontWeight: 700, letterSpacing: '0.12em' }}>
            LIVE SMOGON DATA
          </span>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 820, marginBottom: 28 }}>
          <span style={{ fontSize: 68, fontWeight: 900, color: 'white', lineHeight: 1.05 }}>
            Track the{' '}
            <span style={{ color: '#818cf8' }}>Pokemon Showdown</span>
          </span>
          <span style={{ fontSize: 68, fontWeight: 900, color: 'white', lineHeight: 1.05 }}>
            Competitive Meta
          </span>
        </div>

        {/* Subtitle */}
        <span style={{ fontSize: 26, color: '#94a3b8', maxWidth: 700 }}>
          Real-time Smogon usage stats · Move &amp; Item trends · Gen 1–9 coverage
        </span>

        {/* Bottom stats */}
        <div
          style={{
            display: 'flex',
            gap: 48,
            marginTop: 56,
            paddingTop: 36,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[['800+', 'Pokemon'], ['50+', 'Formats'], ['Monthly', 'Updates']].map(([val, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{val}</span>
              <span style={{ fontSize: 14, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
