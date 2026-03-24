/**
 * Rasterize public/logo-icon.svg to PNGs for SEO (JSON-LD Organization.logo, etc.).
 * Run: node scripts/generate-seo-assets.cjs (also runs via npm prebuild).
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public', 'logo-icon.svg');
const outDir = path.join(root, 'public', 'seo');

if (!fs.existsSync(svgPath)) {
  console.error('Missing', svgPath);
  process.exit(1);
}

const svg = fs.readFileSync(svgPath, 'utf8');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'logo-512.png', w: 512 },
  { name: 'logo-192.png', w: 192 },
  { name: 'logo-180.png', w: 180 },
];

for (const { name, w } of sizes) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: w } });
  const out = path.join(outDir, name);
  fs.writeFileSync(out, resvg.render().asPng());
  console.log('Wrote', out);
}
