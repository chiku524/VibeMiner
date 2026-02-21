/**
 * Server-side only: returns desktop download URLs that always point to the true latest release.
 *
 * Primary: fetch GitHub API /repos/.../releases/latest and build versioned asset URLs
 * (e.g. .../v1.0.22/VibeMiner-Setup-1.0.22.exe). This guarantees users get the actual
 * latest version and is never misleading.
 *
 * Fallback: use GitHub redirect URLs (releases/latest/download/...) only when the API
 * fails. GitHub's "latest" redirect points at the most recent release; the workflow
 * must upload -latest asset copies so that redirect resolves to a real file.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Get env from Cloudflare request context when running in Worker. */
function getCloudflareEnv(): Record<string, unknown> | null {
  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    return env ?? null;
  } catch {
    return null;
  }
}

function envStr(env: Record<string, unknown> | null, ...keys: string[]): string | undefined {
  if (!env) return undefined;
  for (const k of keys) {
    const v = env[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/** Repo in owner/name form. From Cloudflare env or process.env. */
export function getRepoFromEnv(): string {
  const cf = getCloudflareEnv();
  const repo =
    envStr(cf, 'GITHUB_REPO', 'github_repo', 'GITHUB_URL', 'github_url') ??
    process.env.GITHUB_REPO ??
    process.env.github_repo ??
    process.env.GITHUB_URL ??
    process.env.github_url;
  if (repo && typeof repo === 'string') {
    const t = repo.trim();
    if (/^[\w.-]+\/[\w.-]+$/.test(t)) return t;
    const m = t.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
    if (m) return `${m[1]}/${m[2]}`;
  }
  return 'chiku524/VibeMiner';
}

export type DesktopDownloadUrls = {
  win: string | null;
  mac: string | null;
  linux: string | null;
};

/** Versioned asset names produced by electron-builder; these always exist on each release. */
const VERSIONED_ASSET_NAMES = {
  win: (v: string) => `VibeMiner-Setup-${v}.exe`,
  mac: (v: string) => `VibeMiner-${v}-arm64.dmg`,
  linux: (v: string) => `VibeMiner-${v}.AppImage`,
} as const;

export type DesktopDownloadSource = 'github-api' | 'static-latest' | 'fallback';

/**
 * Returns desktop download URLs that point to the true latest release only.
 * Prefer: GitHub API latest release + versioned asset URLs (explicit, never misleading).
 * Fallback: /releases/latest/download/-latest (GitHub redirects to the current latest release).
 */
export async function getLatestDesktopDownloadUrls(): Promise<{
  urls: DesktopDownloadUrls;
  source: DesktopDownloadSource;
  latestTag?: string;
}> {
  const repo = getRepoFromEnv();
  const versionedBase = (tag: string) => `https://github.com/${repo}/releases/download/${tag}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as { tag_name?: string };
      const tag = data?.tag_name;
      if (tag && typeof tag === 'string') {
        const version = tag.replace(/^v/i, '');
        const urls: DesktopDownloadUrls = {
          win: `${versionedBase(tag)}/${VERSIONED_ASSET_NAMES.win(version)}`,
          mac: `${versionedBase(tag)}/${VERSIONED_ASSET_NAMES.mac(version)}`,
          linux: `${versionedBase(tag)}/${VERSIONED_ASSET_NAMES.linux(version)}`,
        };
        return { urls, source: 'github-api', latestTag: tag };
      }
    }
  } catch {
    // ignore: fall back to static URLs
  }

  // Fallback: redirect URLs (work when release workflow uploads -latest assets)
  const base = `https://github.com/${repo}/releases/latest/download`;
  const urls: DesktopDownloadUrls = {
    win: `${base}/VibeMiner-Setup-latest.exe`,
    mac: `${base}/VibeMiner-latest-arm64.dmg`,
    linux: `${base}/VibeMiner-latest.AppImage`,
  };
  return { urls, source: 'static-latest' };
}
