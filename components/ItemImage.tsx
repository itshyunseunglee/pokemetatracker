'use client'

interface Props {
  name: string
  size: 40 | 24
}

export default function ItemImage({ name, size }: Props) {
  const url = `https://www.smogon.com/dex/media/items/${name.toLowerCase().replace(/\s+/g, '-')}.png`
  const cls = size === 40
    ? 'mx-auto my-2 w-10 h-10 object-contain'
    : 'w-6 h-6 object-contain flex-shrink-0'

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className={cls}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
