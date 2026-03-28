/**
 * OpenNext always runs `rmSync('.open-next')` before building. On Windows, that often
 * fails with EPERM/EBUSY when wrangler dev, antivirus, or another process holds files
 * under `apps/web/.open-next/assets`. Deleting the folder may also fail; renaming the
 * whole directory usually succeeds and lets the next build start fresh.
 *
 * Old folders are left as `.open-next.trash.<timestamp>` — safe to delete manually later.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(webRoot, '.open-next');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function tryRm() {
  try {
    if (!fs.existsSync(target)) return true;
    fs.rmSync(target, { recursive: true, force: true });
    return !fs.existsSync(target);
  } catch {
    return false;
  }
}

function tryRename() {
  if (!fs.existsSync(target)) return true;
  const dest = `${target}.trash.${Date.now()}`;
  try {
    fs.renameSync(target, dest);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  for (let i = 0; i < 4; i++) {
    if (tryRm()) return;
    await sleep(500);
  }
  for (let i = 0; i < 4; i++) {
    if (tryRename()) {
      console.warn('[opennext-clean] Renamed locked .open-next to .open-next.trash.* (you can delete it later).');
      return;
    }
    await sleep(500);
  }
  console.error(
    '[opennext-clean] Could not remove or rename apps/web/.open-next.\n' +
      '  Stop `wrangler dev`, close other terminals/IDEs using that folder, then retry.\n' +
      '  If it persists: Task Manager → end any `workerd` / `wrangler` / `node` tied to this project, or reboot.'
  );
  process.exit(1);
}

await main();
