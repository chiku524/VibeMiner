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

console.log(`Set Tauri version to ${version} (${tag})`);
