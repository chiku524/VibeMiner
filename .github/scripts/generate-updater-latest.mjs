#!/usr/bin/env node
/**
 * Build Tauri static updater manifest (latest.json) from release assets + .sig files.
 * Includes each platform only when both the artifact and its .sig exist (under fixed names
 * from the release workflow). Partial manifests are OK: e.g. Windows-only still updates on Windows.
 *
 * Usage: node .github/scripts/generate-updater-latest.mjs <assetsDir> <semverVersion> <githubRepo> <gitTag>
 */
import fs from 'node:fs';
import path from 'node:path';

const [, , assetsDir, version, repo, tag] = process.argv;
if (!assetsDir || !version || !repo || !tag) {
  console.error(
    'Usage: node .github/scripts/generate-updater-latest.mjs <assetsDir> <semverVersion> <githubRepo> <gitTag>'
  );
  process.exit(1);
}

const baseUrl = `https://github.com/${repo}/releases/download/${tag}`;

/** Fixed names produced by .github/workflows/release-desktop.yml "Add latest and versioned asset names". */
const PLATFORM_FILES = [
  { key: 'windows-x86_64', file: `VibeMiner-Setup-${version}.exe` },
  { key: 'darwin-aarch64', file: 'VibeMiner-latest-aarch64.app.tar.gz' },
  { key: 'darwin-x86_64', file: 'VibeMiner-latest-x64.app.tar.gz' },
  { key: 'linux-x86_64', file: `VibeMiner-${version}.AppImage` },
];

const platforms = {};

for (const { key, file } of PLATFORM_FILES) {
  const artifact = path.join(assetsDir, file);
  const sigPath = `${artifact}.sig`;
  if (!fs.existsSync(artifact)) continue;
  if (!fs.existsSync(sigPath)) {
    console.warn(`Skipping ${key}: missing signature file ${file}.sig`);
    continue;
  }
  const signature = fs.readFileSync(sigPath, 'utf8').trim();
  if (!signature) {
    console.warn(`Skipping ${key}: empty signature in ${file}.sig`);
    continue;
  }
  platforms[key] = {
    signature,
    url: `${baseUrl}/${file}`,
  };
}

const platformKeys = Object.keys(platforms);
if (platformKeys.length === 0) {
  console.warn(
    'No signed updater artifacts found — latest.json not written. Need .exe/.AppImage/.app.tar.gz plus matching .sig next to the versioned names from CI.'
  );
  process.exit(0);
}

console.warn(
  'Updater manifest will include:',
  platformKeys.join(', '),
  '(other platforms omitted until signed artifacts exist)'
);

const manifest = {
  version,
  notes: `VibeMiner ${version}`,
  pub_date: new Date().toISOString(),
  platforms,
};

const out = path.join(assetsDir, 'latest.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Wrote', out);
