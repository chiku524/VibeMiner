/**
 * Build brand PNGs from public/brand/logo-source.png:
 * - Chroma-style removal of near-uniform dark background (corners sample).
 * - Transparent master, SEO sizes, favicons, Tauri 1024 source.
 *
 * Run: node scripts/build-brand-assets.cjs (also chained from prebuild).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const brandDir = path.join(root, 'public', 'brand');
const srcPath = path.join(brandDir, 'logo-source.png');

/** Opaque square backing for favicons, SEO tiles, and Tauri icons. Lighter than surface-950 so the mark reads as one unit on taskbar/tray; aligns with surface-850 #1a1d24. */
const ICON_SQUARE_BG = { r: 26, g: 29, b: 36, alpha: 1 };
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

async function fitOnSquareCanvas(pngBuffer, side, background) {
  const meta = await sharp(pngBuffer).metadata();
  const inner = Math.round(side * 0.82);
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
  return sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
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
    const buf = await fitOnSquareCanvas(transparentBuf, w, ICON_SQUARE_BG);
    const out = path.join(seoDir, name);
    await sharp(buf).png().toFile(out);
    console.log('Wrote', out);
  }

  const icon32 = await fitOnSquareCanvas(transparentBuf, 32, ICON_SQUARE_BG);
  await sharp(icon32).toFile(path.join(appDir, 'icon.png'));
  console.log('Wrote', path.join(appDir, 'icon.png'));

  const apple = await fitOnSquareCanvas(transparentBuf, 180, ICON_SQUARE_BG);
  await sharp(apple).toFile(path.join(appDir, 'apple-icon.png'));
  console.log('Wrote', path.join(appDir, 'apple-icon.png'));

  if (fs.existsSync(tauriIconSource)) {
    const tauri1024 = await fitOnSquareCanvas(transparentBuf, 1024, ICON_SQUARE_BG);
    const tauriOut = path.join(tauriIconSource, 'app-icon-1024.png');
    await sharp(tauri1024).png().toFile(tauriOut);
    console.log('Wrote', tauriOut);
  }

  const sm128 = await fitOnSquareCanvas(transparentBuf, 128, ICON_SQUARE_BG);
  await sharp(sm128).toFile(path.join(brandDir, 'logo-mark-128.png'));
  console.log('Wrote', path.join(brandDir, 'logo-mark-128.png'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
