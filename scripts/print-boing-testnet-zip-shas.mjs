#!/usr/bin/env node
/**
 * Print GitHub asset SHA-256 digests for a Boing testnet node release tag (for pasting into
 * `packages/shared/src/boing-testnet-node.ts` and boing.network `website/functions/api/networks.js`).
 *
 * Usage:
 *   node scripts/print-boing-testnet-zip-shas.mjs testnet-v0.1.9
 */
const tag = process.argv[2];
if (!tag || !/^testnet-v0\.1\.\d+$/.test(tag)) {
  console.error('Usage: node scripts/print-boing-testnet-zip-shas.mjs testnet-v0.1.x');
  process.exit(1);
}

const url = `https://api.github.com/repos/Boing-Network/boing.network/releases/tags/${encodeURIComponent(tag)}`;
const res = await fetch(url, {
  headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'vibeminer-print-boing-testnet-zip-shas' },
});
if (!res.ok) {
  console.error(await res.text());
  process.exit(res.status === 404 ? 2 : 1);
}
const body = await res.json();
const assets = Array.isArray(body.assets) ? body.assets : [];
const byName = new Map(assets.map((a) => [a.name, a]));
const order = ['release-windows-x86_64.zip', 'release-linux-x86_64.zip', 'release-macos-aarch64.zip'];
for (const name of order) {
  const a = byName.get(name);
  if (!a?.digest) {
    console.error(`Missing asset or digest: ${name}`);
    process.exit(3);
  }
  const m = /^sha256:([0-9a-f]{64})$/i.exec(a.digest);
  const hex = m ? m[1].toLowerCase() : null;
  if (!hex) {
    console.error(`Bad digest for ${name}: ${a.digest}`);
    process.exit(4);
  }
  console.log(`${name}\t${hex}`);
}
