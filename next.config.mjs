/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.metamap.com https://web-button.metamap.com; connect-src 'self' https://api.metamap.com https://api.mubee-platform.com https://api.int-mykeego-mobility.com;",
          },
        ],
      },
    ]
  },
}

export default nextConfig
