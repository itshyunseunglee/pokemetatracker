'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  urls: string[]
  size: number
  right: number
  top: number
  opacity: number
  animClass: string
  glowColor: string
}

export default function FloatingSprite({ urls, size, right, top, opacity, animClass, glowColor }: Props) {
  const [idx, setIdx] = useState(0)

  // All URLs exhausted — render nothing (don't show broken image or pokeball in hero)
  if (idx >= urls.length) return null

  const src = urls[idx]

  return (
    <div
      className={`absolute ${animClass}`}
      style={{ right, top, opacity, width: size, height: size }}
    >
      {/* Glow behind sprite */}
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: glowColor, transform: 'scale(1.5)' }}
      />
      <Image
        key={src}
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized
        onError={() => setIdx((i) => i + 1)}
        className="relative object-contain drop-shadow-2xl"
        style={{
          width: size,
          height: size,
          filter: 'brightness(0.88) saturate(0.85)',
        }}
      />
    </div>
  )
}
