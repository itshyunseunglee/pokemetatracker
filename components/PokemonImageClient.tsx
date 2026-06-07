'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ArtworkProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
}

export function PokemonArtwork({ src, alt, width = 160, height = 160, priority = false }: ArtworkProps): React.JSX.Element {
  const [error, setError] = useState(false)
  if (error) {
    return <Image src="/pokeball-fallback.svg" alt="Unknown Pokemon" width={120} height={120} className="opacity-40" />
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="object-contain drop-shadow-2xl"
      onError={() => setError(true)}
      priority={priority}
    />
  )
}

interface SpriteProps {
  src: string
  alt: string
  href: string
}

export function PokemonSpriteLink({ src, alt, href }: SpriteProps): React.JSX.Element {
  const [error, setError] = useState(false)
  return (
    <Link href={href} className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded min-h-[44px]">
      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
        {!error ? (
          <Image
            src={src}
            alt={alt}
            width={40}
            height={40}
            className="object-contain"
            onError={() => setError(true)}
            loading="lazy"
          />
        ) : (
          <Image src="/pokeball-fallback.svg" alt="Unknown" width={32} height={32} className="opacity-40" />
        )}
      </div>
    </Link>
  )
}
