/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vibeminer/shared'],
  async redirects() {
    return [
      // Webpack build exposes `app/icon.png` as `/icon.png` (not `/icon`); keep favicon + legacy `/icon` valid.
      { source: '/favicon.ico', destination: '/icon.png', permanent: true },
      { source: '/icon', destination: '/icon.png', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
