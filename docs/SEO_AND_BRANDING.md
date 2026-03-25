# SEO & Branding

This document describes the SEO and branding setup for VibeMiner. Once your domain is configured (e.g. Vercel or Cloudflare), these are active.

## Slogan

The slogan is defined in **`apps/web/src/lib/site.ts`** as `site.slogan`. It is used in:

- Default page title and Open Graph / Twitter cards
- Hero tagline on the homepage
- OG image (social share)
- JSON-LD structured data

Current slogan: **"Mine without the grind."** To change it, edit `site.slogan` in `site.ts`. See `docs/SLOGAN_OPTIONS.md` for alternatives.

## Domain configuration

Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://vibeminer.tech`). This is used for:

- Canonical URLs
- Open Graph and Twitter Card URLs
- Sitemap and robots.txt
- JSON-LD structured data

## SEO

### Meta tags

- **Title**: `VibeMiner — [slogan]` (with per-page template `%s | VibeMiner`)
- **Description**: Full value prop including one-click mining, desktop, auto-updates, networks (Monero, Kaspa, Ergo, etc.), nico.builds
- **Keywords**: crypto mining, blockchain mining, mining pool, decentralized mining, one-click mining, Monero, Kaspa, Raptoreum, Ergo, VibeMiner, no terminal mining, hashrate, contribute hashrate, mining without terminal
- **Open Graph**: type, locale, url, siteName, title, description, **images** (absolute URL to `/opengraph-image`, 1200×630)
- **Twitter Card**: summary_large_image, title, description, creator, **images**
- **Canonical**: Root and per-page canonicals (home, /download, /dashboard, /fees, /login, /register)
- **Robots**: index, follow (crawlable); formatDetection (telephone/email off)
- **Publisher / creator**: VibeMiner

### Structured data (JSON-LD)

- **WebApplication**: name, description, url, slogan, applicationCategory (FinanceApplication), applicationSubCategory (Cryptocurrency mining), operatingSystem, offers (free), featureList, SearchAction (dashboard search)
- **Organization**: name, url, logo, sameAs (Twitter)
- **WebSite**: name, url, description, SearchAction (sitelinks search box)
- **FAQPage** (on `/fees`): network listing fee, withdrawal fee, how fees are used

### Per-page SEO

- **Download** (`/download`): canonical, Open Graph url/title/description
- **Dashboard** (`/dashboard`): canonical, Open Graph url/title/description
- **Fees** (`/fees`): canonical, Open Graph, FAQPage JSON-LD
- **Login** / **Register**: canonical, Open Graph url/title

### Sitemap

- `/sitemap.xml` – Generated dynamically (base URL normalized, no trailing slash)
- Includes: /, /download, /dashboard, /fees, /login, /register
- Change frequencies and priorities set per route

### Robots.txt

- `/robots.txt` – Generated dynamically
- Allows all user agents on /
- Disallows /api/ and /dashboard/network
- References sitemap URL

## Branding

### Logo assets

| Asset | Path | Use |
|-------|------|-----|
| Master source | `public/brand/logo-source.png` | Replace this, then run `npm run generate-brand-assets` in `apps/web` |
| Transparent mark | `/brand/logo-mark-transparent.png` | UI (`BrandMark` via `src/lib/brand.ts`), SVG wrappers |
| On dark (opaque bg) | `/brand/logo-mark-on-dark.png` | Light UI / docs where transparency is awkward |
| Full wordmark (SVG) | `/logo.svg` | Embeds PNG + “VibeMiner” text |
| Icon wrapper (SVG) | `/logo-icon.svg` | Hotlinks; references the transparent PNG |
| Favicon | `src/app/icon.png` (generated) | Browser tab (Next file convention) |
| Apple touch icon | `src/app/apple-icon.png` (generated) | iOS home screen |
| SEO / JSON-LD PNGs | `/seo/logo-512.png` (etc.) | Crawlers, manifests |
| OG image | `/opengraph-image` (dynamic) | Social sharing (1200×630) |

### Brand colors

- **Primary gradient**: `#22d3ee` (cyan) → `#34d399` (emerald)
- **Background**: `#0a0f14` (surface-950)
- **Diamond icon**: Gradient fill with cyan–emerald

### Logo mark

The mark is a neon PCB-style pickaxe (green → cyan). Raster outputs are produced by `apps/web/scripts/build-brand-assets.cjs` from `logo-source.png`. It appears in nav/footer (`BrandMark`), loaders, favicons, OG, and Tauri icons (`npm run icons` in `apps/tauri`).

## Cloudflare setup

When deploying to Cloudflare:

1. Add your custom domain in the Cloudflare dashboard
2. Set `NEXT_PUBLIC_APP_URL` in Wrangler secrets or environment:
   ```bash
   npx wrangler secret put NEXT_PUBLIC_APP_URL
   # Enter: https://vibeminer.tech
   ```
3. Or set it in `wrangler.toml` under `[vars]`:
   ```toml
   [vars]
   NEXT_PUBLIC_APP_URL = "https://vibeminer.tech"
   ```

## Testing SEO

- **Rich results**: [Google Rich Results Test](https://search.google.com/test/rich-results)
- **OG/Twitter**: [OpenGraph.xyz](https://www.opengraph.xyz/), [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **Sitemap**: Visit `/sitemap.xml` on your deployed site
- **Robots**: Visit `/robots.txt` on your deployed site
