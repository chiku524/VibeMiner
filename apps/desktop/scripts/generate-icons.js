/**
 * Generates app icons from the web app logo (SVG → 1024×1024 PNG → .ico / .icns).
 * Run from apps/desktop: npm run generate-icons
 * Requires: @resvg/resvg-js, electron-icon-builder
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const desktopRoot = path.join(__dirname, '..');
const svgPath = path.join(desktopRoot, '..', 'web', 'public', 'logo-icon.svg');
const buildDir = path.join(desktopRoot, 'build');
const outPng = path.join(buildDir, 'icon-1024.png');

if (!fs.existsSync(svgPath)) {
  console.error('Logo SVG not found at', svgPath);
  process.exit(1);
}

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const svg = fs.readFileSync(svgPath);
const { Resvg } = require('@resvg/resvg-js');
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } });
const pngData = resvg.render();
const pngBuffer = pngData.asPng();
fs.writeFileSync(outPng, pngBuffer);
console.log('Created', outPng);

console.log('Running electron-icon-builder...');
execSync(`npx electron-icon-builder --input="${outPng}" --output="${buildDir}"`, {
  cwd: desktopRoot,
  stdio: 'inherit',
});

// electron-builder expects build/icon.ico, build/icon.icns, build/icon.png
const winIco = path.join(buildDir, 'icons', 'win', 'icon.ico');
const macIcns = path.join(buildDir, 'icons', 'mac', 'icon.icns');
if (fs.existsSync(winIco)) fs.copyFileSync(winIco, path.join(buildDir, 'icon.ico'));
if (fs.existsSync(macIcns)) fs.copyFileSync(macIcns, path.join(buildDir, 'icon.icns'));
if (fs.existsSync(outPng)) fs.copyFileSync(outPng, path.join(buildDir, 'icon.png'));

// Linux AppImage expects build/icons/ to contain size-named PNGs (e.g. 256x256.png)
const iconsDir = path.join(buildDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
const sizes = [16, 32, 48, 64, 128, 256, 512];
for (const size of sizes) {
  const resvgSize = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvgSize.render().asPng();
  fs.writeFileSync(path.join(iconsDir, `${size}x${size}.png`), png);
}
console.log('Linux icons ready in build/icons/');

console.log('Icons ready in build/');
