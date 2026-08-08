/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/sprites/**',
      },
      {
        protocol: 'https',
        hostname: 'play.pokemonshowdown.com',
        pathname: '/sprites/**',
      },
    ],
  },
  async redirects() {
    // /moves, /items, /trends moved from ?tier= query params to /[tier] path
    // segments so they can be statically generated (generateStaticParams)
    // instead of forced into per-request dynamic rendering. Preserve old
    // links/bookmarks/search-indexed URLs with permanent redirects.
    const bases = ['moves', 'items', 'trends']
    return bases.flatMap((base) => [
      {
        source: `/${base}`,
        has: [{ type: 'query', key: 'tier', value: '(?<tier>.+)' }],
        destination: `/${base}/:tier`,
        permanent: true,
      },
      {
        source: `/${base}`,
        destination: `/${base}/gen9ou`,
        permanent: true,
      },
    ])
  },
}

export default nextConfig
