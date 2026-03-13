/**
 * Node service: downloads and runs full blockchain nodes.
 * Networks provide nodeDownloadUrl + nodeCommandTemplate via registration.
 * Security: URL allowlist and command validation are enforced at registration.
 */

const { spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { createHash } = require('crypto');
const execAsync = promisify(require('child_process').exec);

const activeNodes = new Map();
const nodeStats = new Map();

function getNetworkKey(networkId, environment) {
  return `${environment || 'mainnet'}:${networkId}`;
}

function sha256Buffer(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Download node binary from URL, verify SHA256 if provided, extract.
 * @param {Object} network - { id, environment, nodeDownloadUrl, nodeCommandTemplate, nodeBinarySha256? }
 * @param {string} userDataPath
 * @param {function} [onProgress] - ({ phase, percent, message }) => void
 * @returns {Promise<{ ok: boolean, nodeDir?: string, error?: string }>}
 */
async function ensureNodeReady(network, userDataPath, onProgress) {
  const key = getNetworkKey(network.id, network.environment || 'mainnet');
  const nodeDir = path.join(userDataPath, 'nodes', key);
  const dataDir = path.join(nodeDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const archivePath = path.join(nodeDir, 'archive');
  const extractPath = path.join(nodeDir, 'extract');

  const report = (phase, percent, message) => onProgress && onProgress({ phase, percent, message });

  if (fs.existsSync(path.join(nodeDir, 'ready'))) {
    return { ok: true, nodeDir, dataDir };
  }

  const url = network.nodeDownloadUrl;
  if (!url || typeof url !== 'string') {
    return { ok: false, error: 'No node download URL' };
  }

  try {
    report('fetching', 0, 'Downloading node…');
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VibeMiner/1.0', Accept: 'application/octet-stream' },
    });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    fs.mkdirSync(nodeDir, { recursive: true });
    fs.writeFileSync(archivePath, bytes);

    if (network.nodeBinarySha256) {
      const actual = sha256Buffer(bytes);
      const expected = network.nodeBinarySha256.toLowerCase();
      if (actual.toLowerCase() !== expected) {
        fs.unlinkSync(archivePath);
        return { ok: false, error: `Integrity check failed: SHA256 mismatch` };
      }
    }

    report('extracting', 50, 'Extracting…');
    fs.mkdirSync(extractPath, { recursive: true });
    const isZip = /\.zip$/i.test(url);
    if (process.platform === 'win32' && isZip) {
      await execAsync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${archivePath.replace(/'/g, "''")}' -DestinationPath '${extractPath.replace(/'/g, "''")}' -Force"`,
        { maxBuffer: 50 * 1024 * 1024 }
      );
    } else if (/\.tar\.gz$/i.test(url) || /\.tgz$/i.test(url)) {
      await execAsync(`tar -xzf "${archivePath}" -C "${extractPath}"`, { maxBuffer: 50 * 1024 * 1024 });
    } else {
      const dest = path.join(extractPath, path.basename(new URL(url).pathname));
      fs.copyFileSync(archivePath, dest);
    }
    try { fs.unlinkSync(archivePath); } catch (_) {}

    const entries = fs.readdirSync(extractPath);
    const subdir = entries.find((e) => fs.statSync(path.join(extractPath, e)).isDirectory());
    const srcDir = subdir ? path.join(extractPath, subdir) : extractPath;
    const binDir = path.join(nodeDir, 'bin');
    if (fs.existsSync(binDir)) fs.rmSync(binDir, { recursive: true });
    fs.renameSync(srcDir, binDir);
    try { fs.rmSync(extractPath, { recursive: true, force: true }); } catch (_) {}

    fs.writeFileSync(path.join(nodeDir, 'ready'), '');
    report('ready', 100, 'Node ready');
    return { ok: true, nodeDir, dataDir: path.join(nodeDir, 'data') };
  } catch (err) {
    console.error('[VibeMiner] Node download error:', err?.message || err);
    return { ok: false, error: err?.message || 'Failed to download node' };
  }
}

/**
 * Start a node for a network.
 * @param {Object} network - { id, environment, nodeCommandTemplate, ... }
 * @param {string} userDataPath
 * @returns {{ ok: boolean, error?: string }}
 */
function startNode(network, userDataPath) {
  const key = getNetworkKey(network.id, network.environment || 'mainnet');
  if (activeNodes.has(key)) {
    return { ok: false, error: 'Node already running' };
  }

  const nodeDir = path.join(userDataPath, 'nodes', key);
  const dataDir = path.join(nodeDir, 'data');
  if (!fs.existsSync(path.join(nodeDir, 'ready'))) {
    return { ok: false, error: 'Node not ready. Run ensureNodeReady first.' };
  }

  const template = network.nodeCommandTemplate || '';
  const cmd = template
    .replace(/\{dataDir\}/g, dataDir)
    .replace(/\{dataDirPath\}/g, dataDir)
    .replace(/\{nodeDir\}/g, path.join(nodeDir, 'bin'))
    .trim();

  const parts = cmd.split(/\s+/);
  const exe = parts[0];
  const args = parts.slice(1);

  const exePath = path.isAbsolute(exe) ? exe : path.resolve(path.join(nodeDir, 'bin'), exe);
  const cwd = path.dirname(exePath);

  if (!fs.existsSync(exePath)) {
    return { ok: false, error: `Node binary not found: ${exePath}` };
  }

  const child = spawn(exePath, args, {
    cwd,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  nodeStats.set(key, { startedAt: Date.now(), status: 'syncing', isActive: true });
  activeNodes.set(key, { child, network });

  child.stdout?.on('data', (d) => {
    const str = String(d);
    if (/synced|sync complete|ready/i.test(str)) {
      const stats = nodeStats.get(key);
      if (stats) stats.status = 'synced';
    }
  });
  child.stderr?.on('data', (d) => {
    const str = String(d);
    if (/synced|sync complete|ready/i.test(str)) {
      const stats = nodeStats.get(key);
      if (stats) stats.status = 'synced';
    }
  });
  child.on('exit', (code) => {
    activeNodes.delete(key);
    const stats = nodeStats.get(key);
    if (stats) stats.isActive = false;
  });
  child.on('error', (err) => {
    activeNodes.delete(key);
    nodeStats.delete(key);
    console.error('[VibeMiner] Node spawn error:', err?.message);
  });

  return { ok: true };
}

function stopNode(networkId, environment) {
  const key = getNetworkKey(networkId, environment || 'mainnet');
  const entry = activeNodes.get(key);
  if (entry) {
    entry.child.kill('SIGTERM');
    activeNodes.delete(key);
  }
  const stats = nodeStats.get(key);
  if (stats) stats.isActive = false;
}

/** Stop all active node processes (e.g. before app update so installer can replace files). */
function stopAllNodes() {
  for (const [key, entry] of activeNodes) {
    try {
      entry.child.kill('SIGTERM');
    } catch (_) {}
    activeNodes.delete(key);
    const stats = nodeStats.get(key);
    if (stats) stats.isActive = false;
  }
}

function getNodeStatus(networkId, environment) {
  const key = getNetworkKey(networkId, environment || 'mainnet');
  return nodeStats.get(key) || null;
}

function isNodeRunning(networkId, environment) {
  const key = getNetworkKey(networkId, environment || 'mainnet');
  return activeNodes.has(key);
}

module.exports = {
  ensureNodeReady,
  startNode,
  stopNode,
  stopAllNodes,
  getNodeStatus,
  isNodeRunning,
};
