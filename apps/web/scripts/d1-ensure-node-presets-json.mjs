#!/usr/bin/env node
/**
 * Idempotent D1 migration: add network_listings.node_presets_json if missing.
 * Raw `ALTER TABLE ... ADD COLUMN` fails on re-run ("duplicate column"); this script
 * checks pragma_table_info first, then runs 002 only when needed.
 *
 * Usage (from repo root): npm run db:ensure-node-presets-json -w vibeminer-web
 * Flags: pass `--local` to target the dev database instead of `--remote`.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const DB = 'vibeminer-db';

const useLocal = process.argv.includes('--local');
const locationArgs = useLocal ? ['--local'] : ['--remote'];

function resolveWranglerCli() {
  try {
    const require = createRequire(join(webRoot, 'package.json'));
    return require.resolve('wrangler/bin/wrangler.js');
  } catch {
    return null;
  }
}

function runWrangler(wranglerArgs, inheritStdio) {
  const cli = resolveWranglerCli();
  const common = {
    cwd: webRoot,
    encoding: 'utf8',
    stdio: inheritStdio ? 'inherit' : ['pipe', 'pipe', 'pipe'],
  };
  if (cli) {
    // Avoid shell: true so `--command` SQL stays one argument (Windows-safe).
    return spawnSync(process.execPath, [cli, ...wranglerArgs], { ...common, shell: false });
  }
  return spawnSync('npx', ['wrangler', ...wranglerArgs], { ...common, shell: false });
}

const countSql =
  "SELECT COUNT(*) AS c FROM pragma_table_info('network_listings') WHERE name='node_presets_json'";

const probe = runWrangler(['d1', 'execute', DB, ...locationArgs, '--command', countSql, '--json']);
if (probe.status !== 0) {
  console.error(probe.stderr || probe.stdout || 'wrangler failed');
  process.exit(probe.status ?? 1);
}

let count = 0;
try {
  const parsed = JSON.parse(probe.stdout.trim());
  const row = parsed[0]?.results?.[0];
  count = Number(row?.c ?? 0);
} catch {
  console.error('Could not parse wrangler JSON output:\n', probe.stdout);
  process.exit(1);
}

if (count > 0) {
  console.log(
    `node_presets_json already exists on ${useLocal ? 'local' : 'remote'} ${DB} — nothing to do.`
  );
  process.exit(0);
}

console.log(`Adding node_presets_json to network_listings (${useLocal ? 'local' : 'remote'})...`);
const apply = runWrangler(
  ['d1', 'execute', DB, ...locationArgs, '--file=./d1/migrations/002_add_node_presets_json.sql'],
  true
);
process.exit(apply.status ?? 1);
