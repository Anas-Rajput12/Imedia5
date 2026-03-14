// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL
  },
  // Ensure proper static file handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '/',
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Disable strict mode in dev to prevent double rendering
  devIndicators: {
    buildActivity: true,
  },
}

module.exports = nextConfig