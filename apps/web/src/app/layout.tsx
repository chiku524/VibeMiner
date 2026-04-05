import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { SkipToMain } from '@/components/SkipToMain';
import { site } from '@/lib/site';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const baseUrl = site.baseUrl;
const base = baseUrl.replace(/\/$/, '');
const ogImageUrl = `${base}${site.openGraphImagePath}`;
const organizationLogoUrl = `${base}${site.organizationLogoPngPath}`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${site.name} — ${site.slogan}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'crypto mining',
    'blockchain mining',
    'mining pool',
    'decentralized mining',
    'one-click mining',
    'Monero',
    'Kaspa',
    'Raptoreum',
    'Ergo',
    'VibeMiner',
    'no terminal mining',
    'hashrate',
    'contribute hashrate',
    'mining without terminal',
  ],
  authors: [{ name: site.name, url: baseUrl }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { telephone: false, email: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: site.name,
    title: `${site.name} — ${site.slogan}`,
    description: site.description,
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: site.openGraphImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.slogan}`,
    description: site.description,
    creator: site.twitter,
    images: [{ url: ogImageUrl, alt: site.openGraphImageAlt }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: baseUrl },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: site.name,
      applicationCategory: 'FinanceApplication',
      applicationSubCategory: 'Cryptocurrency mining',
      description: site.description,
      url: baseUrl,
      image: ogImageUrl,
      slogan: site.slogan,
      operatingSystem: 'Web browser, Windows, macOS, Linux',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      featureList: 'One-click mining, no terminal, desktop app with auto-updates, multi-network support',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/dashboard?search={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: organizationLogoUrl,
        contentUrl: organizationLogoUrl,
        caption: site.organizationLogoCaption,
        width: 512,
        height: 512,
      },
      sameAs: [`https://twitter.com/${site.twitter.replace('@', '')}`],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: baseUrl,
      description: site.description,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/dashboard?search={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  const origin = new URL(baseUrl).origin;

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0a0f14" />
        <script src="/desktop-bridge.js" />
        <link rel="preconnect" href={origin} />
        <link rel="dns-prefetch" href={origin} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased bg-surface-950 text-gray-100 min-h-screen`}>
        <SkipToMain />
        <div id="main-content" tabIndex={-1}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
