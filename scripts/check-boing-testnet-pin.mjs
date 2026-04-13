#!/usr/bin/env node
/**
 * CI helper: fail if the latest `testnet-v0.1.N` GitHub release (by numeric N) is newer than
 * `BOING_TESTNET_DEFAULT_DOWNLOAD_TAG` in `packages/shared/src/boing-testnet-node.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseTestnetV01Patch(tag) {
  const m = /^testnet-v0\.1\.(\d+)$/.exec(tag);
  return m ? parseInt(m[1], 10) : -1;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'packages', 'shared', 'src', 'boing-testnet-node.ts');
const src = fs.readFileSync(srcPath, 'utf8');
const m = /export const BOING_TESTNET_DEFAULT_DOWNLOAD_TAG = '([^']+)'/.exec(src);
if (!m) {
  console.error('Could not parse BOING_TESTNET_DEFAULT_DOWNLOAD_TAG from', srcPath);
  process.exit(1);
}
const pinned = m[1];
const pinPatch = parseTestnetV01Patch(pinned);
if (pinPatch < 0) {
  console.error('Pinned tag is not testnet-v0.1.N:', pinned);
  process.exit(1);
}

const listUrl =
  'https://api.github.com/repos/Boing-Network/boing.network/releases?per_page=40';
const res = await fetch(listUrl, {
  headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'vibeminer-check-boing-testnet-pin' },
});
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
const releases = await res.json();
let latestTag = null;
let latestPatch = -1;
for (const r of releases) {
  const t = r.tag_name;
  if (typeof t !== 'string') continue;
  const p = parseTestnetV01Patch(t);
  if (p > latestPatch) {
    latestPatch = p;
    latestTag = t;
  }
}
if (latestTag == null) {
  console.error('No testnet-v0.1.N release found on GitHub.');
  process.exit(1);
}

console.log(`Pinned in repo: ${pinned} (patch ${pinPatch})`);
console.log(`Latest on GitHub (among recent releases): ${latestTag} (patch ${latestPatch})`);

if (latestPatch > pinPatch) {
  console.error(
    '\nPinned tag is older than the latest GitHub testnet-v0.1.N release. Bump BOING_TESTNET_DEFAULT_DOWNLOAD_TAG and zip SHA256 constants (see scripts/print-boing-testnet-zip-shas.mjs and docs/BOING_TESTNET_PIN_SYNC.md).',
  );
  process.exit(2);
}

console.log('OK: pin is at or ahead of latest testnet-v0.1.N in recent GitHub releases.');
