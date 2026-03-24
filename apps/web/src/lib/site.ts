/**
 * Site configuration for SEO and metadata.
 * Single source for slogan: change here to update Hero, meta titles, Open Graph, and docs.
 */
export const site = {
  name: 'VibeMiner',
  slogan: 'Mine without the grind.',
  description:
    'Mine cryptocurrencies for networks that need you. One-click mining, no terminal or config files. Web app and desktop (Windows, macOS, Linux) with auto-updates. Contribute hashrate to Monero, Kaspa, Ergo and more. By nico.builds.',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://vibeminer.tech',
  twitter: '@vibeminer',
  /** Used for Open Graph and Twitter Card images (absolute URL). */
  openGraphImagePath: '/opengraph-image',
  /** Static PNG derived from logo-icon.svg — Organization.logo in JSON-LD (crawler-friendly). */
  organizationLogoPngPath: '/seo/logo-512.png',
} as const;
