'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  urls: string[]       // ordered list: try each in sequence on error
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  loading?: 'eager' | 'lazy'
}

export default function SmartPokemonImage({
  urls,
  alt,
  width,
  height,
  className = '',
  priority,
  loading = 'lazy',
}: Props) {
  const [idx, setIdx] = useState(0)

  if (idx >= urls.length) {
    return (
      <Image
        src="/pokeball-fallback.svg"
        alt="Pokemon"
        width={Math.max(32, Math.round(width * 0.72))}
        height={Math.max(32, Math.round(height * 0.72))}
        className="opacity-30 object-contain"
      />
    )
  }

  const src = urls[idx]

  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      onError={() => setIdx((i) => i + 1)}
      priority={priority}
      loading={priority ? 'eager' : loading}
      unoptimized={src.startsWith('https://')}
    />
  )
}
