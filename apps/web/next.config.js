/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vibeminer/shared'],
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/icon', permanent: true },
    ];
  },
};

module.exports = nextConfig;
