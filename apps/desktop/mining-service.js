/**
 * Mining service: spawns and manages miner processes for real pool mining.
 * Supports xmrig (RandomX, Ghostrider). XMRig is auto-downloaded from GitHub
 * on first use so users only need to install VibeMiner.
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const execAsync = promisify(exec);

/** Active miner processes by networkKey */
const activeMiners = new Map();

/** Last stats received from each miner (hashrate, shares, etc.) */
const minerStats = new Map();

const XMRIG_RELEASE_URL = 'https://api.github.com/repos/xmrig/xmrig/releases/latest';

/** Map platform+arch to xmrig asset name pattern (regex or substring match) */
function getAssetPattern(platform, arch) {
  if (platform === 'win32') {
    if (arch === 'arm64') return /windows-arm64\.zip$/i;
    return /windows-x64\.zip$/i;
  }
  if (platform === 'darwin') {
    if (arch === 'arm64') return /macos-arm64\.tar\.gz$/i;
    return /macos-x64\.tar\.gz$/i;
  }
  if (platform === 'linux') return /linux-static-x64\.tar\.gz$/i;
  return null;
}

/**
 * Download XMRig from GitHub releases and extract to cache.
 * @param {string} userDataPath - app.getPath('userData')
 * @param {function(progress)} [onProgress] - callback with { phase, percent?, message }
 * @returns {Promise<{ ok: boolean, minerPath?: string, error?: string }>}
 */
async function ensureMinerReady(userDataPath, onProgress) {
  const platform = process.platform;
  const arch = process.arch;
  const report = (phase, percent, message) => onProgress && onProgress({ phase, percent, message });

  const minersDir = path.join(userDataPath, 'miners', 'xmrig');
  const ext = platform === 'win32' ? '.exe' : '';
  const minerName = `xmrig${ext}`;
  const minerPath = path.join(minersDir, minerName);

  if (fs.existsSync(minerPath)) {
    return { ok: true, minerPath };
  }

  try {
    report('fetching', 0, 'Checking for miner…');
    const res = await fetch(XMRIG_RELEASE_URL, {
      headers: { 'User-Agent': 'VibeMiner/1.0', Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    const release = await res.json();
    const assets = release.assets || [];
    const pattern = getAssetPattern(platform, arch);
    if (!pattern) throw new Error(`Unsupported platform: ${platform}/${arch}`);
    const asset = assets.find((a) => pattern.test(a.name));
    if (!asset) throw new Error(`No XMRig binary for ${platform}/${arch}`);
    const url = asset.browser_download_url;

    report('downloading', 5, 'Downloading miner…');
    fs.mkdirSync(minersDir, { recursive: true });
    const archivePath = path.join(minersDir, asset.name);
    const fileRes = await fetch(url, {
      headers: { 'User-Agent': 'VibeMiner/1.0', Accept: 'application/octet-stream' },
    });
    if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.status}`);
    const total = parseInt(fileRes.headers.get('content-length') || '0', 10);
    const buf = await fileRes.arrayBuffer();
    fs.writeFileSync(archivePath, new Uint8Array(buf));
    if (total > 0 && onProgress) report('downloading', 55, 'Download complete');

    report('extracting', 60, 'Extracting…');
    const isZip = /\.zip$/i.test(asset.name);
    const extractDir = path.join(minersDir, 'extract');
    fs.mkdirSync(extractDir, { recursive: true });

    if (isZip) {
      await execAsync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${archivePath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
    } else {
      await execAsync(`tar -xzf "${archivePath}" -C "${extractDir}"`, { maxBuffer: 10 * 1024 * 1024 });
    }

    const subdir = fs.readdirSync(extractDir).find((n) => n.startsWith('xmrig-'));
    const srcDir = subdir ? path.join(extractDir, subdir) : extractDir;
    const files = fs.readdirSync(srcDir);
    const binName = files.find((n) => n === 'xmrig' || n === 'xmrig.exe') || minerName;
    const src = path.join(srcDir, binName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, minerPath);
    }
    fs.rmSync(extractDir, { recursive: true, force: true });
    try { fs.unlinkSync(archivePath); } catch (_) {}
    if (platform !== 'win32') {
      fs.chmodSync(minerPath, 0o755);
    }
    report('ready', 100, 'Miner ready');
    return { ok: true, minerPath };
  } catch (err) {
    console.error('[VibeMiner] Miner download error:', err?.message || err);
    return { ok: false, error: err?.message || 'Failed to download miner' };
  }
}

function getMinerPath(platform, minerType, userDataPath) {
  const minersDir = process.resourcesPath
    ? path.join(process.resourcesPath, 'miners')
    : path.join(__dirname, 'resources', 'miners');
  const ext = platform === 'win32' ? '.exe' : '';
  const names = {
    xmrig: `xmrig${ext}`,
    lolminer: platform === 'win32' ? 'lolMiner.exe' : 'lolMiner',
    kaspaminer: platform === 'win32' ? 'kaspaminer.exe' : 'kaspaminer',
  };
  const name = names[minerType] || names.xmrig;
  const bundled = path.join(minersDir, platform, name);
  if (fs.existsSync(bundled)) return bundled;
  const devBundled = path.join(__dirname, 'resources', 'miners', platform, name);
  if (fs.existsSync(devBundled)) return devBundled;
  if (userDataPath) {
    const cached = path.join(userDataPath, 'miners', 'xmrig', platform === 'win32' ? 'xmrig.exe' : 'xmrig');
    if (fs.existsSync(cached)) return cached;
  }
  return null;
}

/**
 * Build xmrig args for pool connection.
 * @param {Object} opts
 * @param {string} opts.poolUrl
 * @param {number} opts.poolPort
 * @param {string} opts.walletAddress
 * @param {string} opts.algorithm - 'randomx' | 'ghostrider' | 'gr'
 */
function buildXmrigArgs({ poolUrl, poolPort, walletAddress, algorithm }) {
  const algo = (algorithm || 'randomx').toLowerCase();
  const isGr = algo.includes('ghostrider') || algo === 'gr';
  const args = [
    '--url', `${poolUrl}:${poolPort}`,
    '-u', walletAddress,
    '--donate-level', '0',
    '--no-color',
    '-l', 'mining.log',
  ];
  if (isGr) {
    args.push('-a', 'ghostrider');
  }
  return args;
}

/**
 * Parse xmrig stdout line for hashrate. Example:
 * [2024-01-01 12:00:00] speed 10s/60s/15m 500 H/s 480 H/s 490 H/s
 */
function parseXmrigLine(line) {
  const str = String(line || '');
  const speedMatch = str.match(/speed\s+[\d]+\w+\/[\d]+\w+\/[\d]+\w+\s+([\d.]+)\s+H\/s/);
  if (speedMatch) {
    return { hashrate: parseFloat(speedMatch[1]) || 0 };
  }
  const simpleMatch = str.match(/([\d.]+)\s+H\/s/);
  if (simpleMatch) {
    return { hashrate: parseFloat(simpleMatch[1]) || 0 };
  }
  return null;
}

function getNetworkKey(networkId, environment) {
  return `${environment}:${networkId}`;
}

/**
 * Start mining for a network.
 * @param {Object} network - { id, poolUrl, poolPort, algorithm, environment }
 * @param {string} walletAddress
 * @param {string} minerPath - optional override
 * @returns {{ ok: boolean, error?: string }}
 */
function startMining(network, walletAddress, minerPath, userDataPath) {
  if (!network || !network.poolUrl || !network.poolPort) {
    return { ok: false, error: 'Network missing pool URL or port' };
  }
  if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim().length < 10) {
    return { ok: false, error: 'Valid wallet address required' };
  }

  const key = getNetworkKey(network.id, network.environment || 'mainnet');
  if (activeMiners.has(key)) {
    return { ok: false, error: 'Already mining this network' };
  }

  const platform = process.platform;
  const minerType = 'xmrig'; // For now we only support xmrig (RandomX, Ghostrider)
  const resolvedPath = minerPath || getMinerPath(platform, minerType, userDataPath);

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return {
      ok: false,
      error: 'Miner not found. Start mining again to auto-download XMRig, or install from https://xmrig.com/download.',
    };
  }

  const args = buildXmrigArgs({
    poolUrl: network.poolUrl,
    poolPort: network.poolPort,
    walletAddress: walletAddress.trim(),
    algorithm: network.algorithm,
  });

  const cwd = path.dirname(resolvedPath);
  const child = spawn(resolvedPath, args, {
    cwd,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  minerStats.set(key, {
    networkId: network.id,
    environment: network.environment || 'mainnet',
    startedAt: Date.now(),
    hashrate: 0,
    shares: 0,
    isActive: true,
  });

  child.stdout?.on('data', (data) => {
    const lines = String(data).split('\n');
    for (const line of lines) {
      const parsed = parseXmrigLine(line);
      if (parsed) {
        const stats = minerStats.get(key);
        if (stats) {
          stats.hashrate = parsed.hashrate || stats.hashrate;
        }
      }
    }
  });

  child.stderr?.on('data', (data) => {
    const str = String(data);
    const parsed = parseXmrigLine(str);
    if (parsed) {
      const stats = minerStats.get(key);
      if (stats) {
        stats.hashrate = parsed.hashrate || stats.hashrate;
      }
    }
  });

  child.on('exit', (code, signal) => {
    activeMiners.delete(key);
    const stats = minerStats.get(key);
    if (stats) stats.isActive = false;
  });

  child.on('error', (err) => {
    activeMiners.delete(key);
    minerStats.delete(key);
    console.error('[VibeMiner] Miner spawn error:', err?.message);
  });

  activeMiners.set(key, { child, network });
  return { ok: true };
}

/**
 * Stop mining for a network.
 * @param {string} networkId
 * @param {string} environment
 */
function stopMining(networkId, environment) {
  const key = getNetworkKey(networkId, environment || 'mainnet');
  const entry = activeMiners.get(key);
  if (entry) {
    entry.child.kill('SIGTERM');
    activeMiners.delete(key);
  }
  minerStats.delete(key);
}

/** Stop all active miner processes (e.g. before app update so installer can replace files). */
function stopAllMiners() {
  for (const [key, entry] of activeMiners) {
    try {
      entry.child.kill('SIGTERM');
    } catch (_) {}
    activeMiners.delete(key);
    minerStats.delete(key);
  }
}

/**
 * Get current mining stats for a network or all.
 * @param {string} [networkId]
 * @param {string} [environment]
 */
function getStats(networkId, environment) {
  if (networkId && environment) {
    const key = getNetworkKey(networkId, environment);
    return minerStats.get(key) || null;
  }
  return Array.from(minerStats.values()).filter((s) => s.isActive);
}

function isMining(networkId, environment) {
  const key = getNetworkKey(networkId, environment || 'mainnet');
  return activeMiners.has(key);
}

module.exports = {
  startMining,
  stopMining,
  stopAllMiners,
  getStats,
  isMining,
  getMinerPath,
  ensureMinerReady,
};
