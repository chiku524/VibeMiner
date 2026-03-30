/**
 * Build brand PNGs from public/brand/logo-source.png:
 * - Chroma-style removal of near-uniform dark background (corners sample).
 * - Transparent master, SEO sizes, favicons, Tauri 1024 source.
 * - Static Open Graph image (1200×630) at src/app/opengraph-image.png — avoids next/og + yoga.wasm,
 *   which breaks OpenNext + Wrangler deploy (absolute wasm paths in the server bundle).
 *
 * Run: node scripts/build-brand-assets.cjs (also chained from prebuild).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const brandDir = path.join(root, 'public', 'brand');
const srcPath = path.join(brandDir, 'logo-source.png');

/**
 * Opaque circular disc behind the mark (favicons, SEO tiles, Tauri source).
 * Light mint-slate so the teal/indigo mark reads clearly and blends with brand gradients.
 */
const ICON_DISC_BG = { r: 228, g: 241, b: 239, alpha: 1 };
const ICON_DISC_HEX = '#e4f1ef';
const seoDir = path.join(root, 'public', 'seo');
const appDir = path.join(root, 'src', 'app');
const tauriIconSource = path.join(root, '..', 'tauri', 'icon-source');

function avgCornerRgb({ data, width, height, channels }, cx, cy, rw, rh) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = cy; y < cy + rh; y++) {
    for (let x = cx; x < cx + rw; x++) {
      if (x >= width || y >= height) continue;
      const i = (y * width + x) * channels;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  return [r / n, g / n, b / n];
}

async function removeNearBackground(inputBuffer, threshold = 42) {
  const { data, info } = await sharp(inputBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const s = Math.min(24, Math.floor(width / 8), Math.floor(height / 8));
  const corners = [
    avgCornerRgb({ data, width, height, channels }, 0, 0, s, s),
    avgCornerRgb({ data, width, height, channels }, width - s, 0, s, s),
    avgCornerRgb({ data, width, height, channels }, 0, height - s, s, s),
    avgCornerRgb({ data, width, height, channels }, width - s, height - s, s, s),
  ];
  const refR = corners.reduce((a, c) => a + c[0], 0) / 4;
  const refG = corners.reduce((a, c) => a + c[1], 0) / 4;
  const refB = corners.reduce((a, c) => a + c[2], 0) / 4;

  const out = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const dr = Math.abs(data[i] - refR);
      const dg = Math.abs(data[i + 1] - refG);
      const db = Math.abs(data[i + 2] - refB);
      if (dr < threshold && dg < threshold && db < threshold) {
        out[i + 3] = 0;
      }
    }
  }

  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** Circular badge: filled disc + centered logo (square canvas, transparent outside the circle). */
async function fitOnCircularCanvas(pngBuffer, side, background) {
  const inner = Math.round(side * 0.68);
  const resized = await sharp(pngBuffer)
    .resize({
      width: inner,
      height: inner,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();
  const { width: w, height: h } = await sharp(resized).metadata();
  const left = Math.round((side - w) / 2);
  const top = Math.round((side - h) / 2);
  const cx = side / 2;
  const cy = side / 2;
  const r = side / 2 - 0.5;
  const { r: br, g: bg, b: bb } = background;
  const circleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgb(${br},${bg},${bb})"/>
</svg>`;
  return sharp(Buffer.from(circleSvg))
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

/** Keep in sync with src/lib/site.ts (name, slogan, description line used on OG card). */
const OG_TITLE = 'VibeMiner';
const OG_SLOGAN = 'Mine without the grind.';
const OG_TAGLINE = 'Mine cryptocurrencies for networks that need you';

async function writeOpenGraphPng(transparentBuf) {
  const W = 1200;
  const H = 630;
  const logoInner = 64;
  const logoBox = 88;
  const gap = 24;
  const cx = W / 2;
  const rowY = 260;
  const titleApproxW = 400;
  const rowW = logoBox + gap + titleApproxW;
  const startX = cx - rowW / 2;

  const logoSmall = await sharp(transparentBuf).resize(logoInner, logoInner).png().toBuffer();
  const logoB64 = logoSmall.toString('base64');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">
  <defs>
    <linearGradient id="og-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f14"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="og-title" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="35%" stop-color="#2dd4bf"/>
      <stop offset="70%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#4338ca"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#og-bg)"/>
  <circle cx="${startX + logoBox / 2}" cy="${rowY}" r="${logoBox / 2 - 0.5}" fill="${ICON_DISC_HEX}" stroke="rgb(148,163,184)" stroke-opacity="0.35" stroke-width="1"/>
  <image xlink:href="data:image/png;base64,${logoB64}" x="${startX + (logoBox - logoInner) / 2}" y="${rowY - logoInner / 2}" width="${logoInner}" height="${logoInner}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${startX + logoBox + gap}" y="${rowY}" fill="url(#og-title)" font-family="system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif" font-size="64" font-weight="700" letter-spacing="-0.02em" dominant-baseline="middle">${OG_TITLE}</text>
  <text x="${cx}" y="${rowY + logoBox / 2 + 48}" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif" font-size="32" font-weight="600">${OG_SLOGAN}</text>
  <text x="${cx}" y="${rowY + logoBox / 2 + 48 + 52}" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif" font-size="20">${OG_TAGLINE}</text>
</svg>`;

  const outPath = path.join(appDir, 'opengraph-image.png');
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
  console.log('Wrote', outPath);
}

async function main() {
  if (!fs.existsSync(srcPath)) {
    console.error('Missing', srcPath);
    process.exit(1);
  }

  fs.mkdirSync(brandDir, { recursive: true });
  fs.mkdirSync(seoDir, { recursive: true });
  fs.mkdirSync(appDir, { recursive: true });
  if (fs.existsSync(tauriIconSource)) {
    fs.mkdirSync(tauriIconSource, { recursive: true });
  }

  const masterW = 1024;
  const scaledSrc = await sharp(srcPath)
    .resize({ width: masterW, height: masterW, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  let transparentBuf = await removeNearBackground(scaledSrc, 44);

  const outTransparent = path.join(brandDir, 'logo-mark-transparent.png');
  await sharp(transparentBuf).png({ compressionLevel: 9 }).toFile(outTransparent);
  console.log('Wrote', outTransparent);

  await writeOpenGraphPng(transparentBuf);

  const onDark = await sharp(transparentBuf)
    .flatten({ background: { r: 12, g: 14, b: 18 } })
    .png()
    .toBuffer();
  const outOnDark = path.join(brandDir, 'logo-mark-on-dark.png');
  await sharp(onDark).toFile(outOnDark);
  console.log('Wrote', outOnDark);

  const seoSizes = [
    { name: 'logo-512.png', w: 512 },
    { name: 'logo-192.png', w: 192 },
    { name: 'logo-180.png', w: 180 },
  ];
  for (const { name, w } of seoSizes) {
    const buf = await fitOnCircularCanvas(transparentBuf, w, ICON_DISC_BG);
    const out = path.join(seoDir, name);
    await sharp(buf).png().toFile(out);
    console.log('Wrote', out);
  }

  const icon32 = await fitOnCircularCanvas(transparentBuf, 32, ICON_DISC_BG);
  await sharp(icon32).toFile(path.join(appDir, 'icon.png'));
  console.log('Wrote', path.join(appDir, 'icon.png'));

  const apple = await fitOnCircularCanvas(transparentBuf, 180, ICON_DISC_BG);
  await sharp(apple).toFile(path.join(appDir, 'apple-icon.png'));
  console.log('Wrote', path.join(appDir, 'apple-icon.png'));

  if (fs.existsSync(tauriIconSource)) {
    const tauri1024 = await fitOnCircularCanvas(transparentBuf, 1024, ICON_DISC_BG);
    const tauriOut = path.join(tauriIconSource, 'app-icon-1024.png');
    await sharp(tauri1024).png().toFile(tauriOut);
    console.log('Wrote', tauriOut);
  }

  const sm128 = await fitOnCircularCanvas(transparentBuf, 128, ICON_DISC_BG);
  await sharp(sm128).toFile(path.join(brandDir, 'logo-mark-128.png'));
  console.log('Wrote', path.join(brandDir, 'logo-mark-128.png'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
