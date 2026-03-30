/**
 * Sync release tag into Tauri package metadata (workspace root: run via `node .github/scripts/...`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');

const tag = (process.env.RELEASE_TAG || '').trim();
if (!tag) {
  console.error('RELEASE_TAG is required');
  process.exit(1);
}
const version = tag.replace(/^v/i, '');

const tauriConfPath = path.join(root, 'apps/tauri/src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = version;
fs.writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);

const cargoPath = path.join(root, 'apps/tauri/src-tauri/Cargo.toml');
let cargo = fs.readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/^version = "[^"]+"/m, `version = "${version}"`);
fs.writeFileSync(cargoPath, cargo);

const pkgPath = path.join(root, 'apps/tauri/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = version;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const webPkgPath = path.join(root, 'apps/web/package.json');
const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf8'));
webPkg.version = version;
fs.writeFileSync(webPkgPath, `${JSON.stringify(webPkg, null, 2)}\n`);

const wranglerPath = path.join(root, 'apps/web/wrangler.toml');
let wrangler = fs.readFileSync(wranglerPath, 'utf8');
const winUrl = `https://github.com/chiku524/VibeMiner/releases/download/${tag}/VibeMiner-Setup-${version}.exe`;
const macUrl = `https://github.com/chiku524/VibeMiner/releases/download/${tag}/VibeMiner-${version}-arm64.dmg`;
const linuxUrl = `https://github.com/chiku524/VibeMiner/releases/download/${tag}/VibeMiner-${version}.AppImage`;
wrangler = wrangler.replace(/^NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN = ".*"$/m, `NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN = "${winUrl}"`);
wrangler = wrangler.replace(/^NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC = ".*"$/m, `NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC = "${macUrl}"`);
wrangler = wrangler.replace(/^NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX = ".*"$/m, `NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX = "${linuxUrl}"`);
fs.writeFileSync(wranglerPath, wrangler);

console.log(`Set Tauri + web + wrangler version to ${version} (${tag})`);
