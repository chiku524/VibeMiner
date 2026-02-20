/**
 * Server-side only: fetches latest GitHub release and returns desktop download URLs.
 * Used by the API route and by the download page for initial (SSR) data so the
 * first paint shows the latest release, not build-time env fallback.
 *
 * Cloudflare: Set GITHUB_TOKEN (encrypted secret) and optionally GITHUB_REPO in
 * Workers & Pages → your project → Settings → Variables and secrets so the
 * GitHub API is used and links update automatically on new releases.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Get env from Cloudflare request context when running in Worker. Tries sync first, then async (for SSG/edge). */
async function getCloudflareEnvAsync(): Promise<Record<string, unknown> | null> {
  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    if (env) return env;
  } catch {
    // sync context not available (e.g. some SSR paths)
  }
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    return env ?? null;
  } catch {
    return null;
  }
}

/** Sync version for callers that cannot await (e.g. getRepoFromEnv). Use getCloudflareEnvAsync inside getLatestDesktopDownloadUrls. */
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

/** Get token from Cloudflare env (dashboard secret) or process.env (local/preview). */
function getGitHubToken(): string | undefined {
  const cf = getCloudflareEnv();
  return envStr(cf, 'GITHUB_TOKEN', 'github_token') ?? process.env.GITHUB_TOKEN ?? process.env.github_token;
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

/** Fallback when GitHub API fails. Read from Cloudflare env first (dashboard vars), then process.env (wrangler [vars] at build). */
function getEnvFallbackDownloads(): DesktopDownloadUrls {
  const cf = getCloudflareEnv();
  return {
    win: (envStr(cf, 'NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN') ?? process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN) ?? null,
    mac: (envStr(cf, 'NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC') ?? process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC) ?? null,
    linux: (envStr(cf, 'NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX') ?? process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX) ?? null,
  };
}

/** Parse tag (e.g. v1.0.8) to [major, minor, patch] for comparison. */
function parseTagVersion(tagName: string): number[] {
  const m = tagName.replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

/** Compare two tag versions; returns positive if a > b. */
function compareTagVersions(a: string, b: string): number {
  const va = parseTagVersion(a);
  const vb = parseTagVersion(b);
  for (let i = 0; i < 3; i++) {
    if (va[i] !== vb[i]) return va[i] - vb[i];
  }
  return 0;
}

interface GhRelease {
  tag_name: string;
  assets?: Array<{ name: string; browser_download_url: string }>;
}

export type DesktopDownloadSource = 'github-api' | 'fallback';

/**
 * Fetches releases and returns download URLs from the release with the **highest semantic version**
 * (e.g. v1.0.8), not GitHub's "latest" which is by publish date and can be an older version.
 * Also returns source, latestTag, tokenPresent, and optionally githubStatus for debugging.
 */
export async function getLatestDesktopDownloadUrls(): Promise<{
  urls: DesktopDownloadUrls;
  source: DesktopDownloadSource;
  latestTag?: string;
  tokenPresent: boolean;
  githubStatus?: number;
  githubMessage?: string;
}> {
  const env = await getCloudflareEnvAsync();
  const repoRaw =
    envStr(env, 'GITHUB_REPO', 'github_repo', 'GITHUB_URL', 'github_url') ??
    process.env.GITHUB_REPO ??
    process.env.GITHUB_URL ??
    'chiku524/VibeMiner';
  const t = String(repoRaw).trim();
  let repo = 'chiku524/VibeMiner';
  if (t && /^[\w.-]+\/[\w.-]+$/.test(t)) repo = t;
  else {
    const m = t.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
    if (m) repo = `${m[1]}/${m[2]}`;
  }
  const rawToken =
    envStr(env, 'GITHUB_TOKEN', 'github_token') ?? process.env.GITHUB_TOKEN ?? process.env.github_token;
  const token = typeof rawToken === 'string' ? rawToken.trim() : undefined;
  const tokenPresent = !!token;
  const fallback: DesktopDownloadUrls = {
    win: (envStr(env, 'NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN') ?? process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN) ?? null,
    mac: (envStr(env, 'NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC') ?? process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC) ?? null,
    linux: (envStr(env, 'NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX') ?? process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX) ?? null,
  };

  const authHeader =
    token && /^ghp_/.test(token)
      ? { Authorization: `token ${token}` }
      : token
        ? { Authorization: `Bearer ${token}` }
        : {};

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases?per_page=100`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...authHeader,
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      let githubMessage: string | undefined;
      try {
        const errBody = await res.text();
        const parsed = JSON.parse(errBody) as { message?: string };
        if (typeof parsed?.message === 'string') githubMessage = parsed.message;
      } catch {
        // ignore
      }
      return { urls: fallback, source: 'fallback', tokenPresent, githubStatus: res.status, githubMessage };
    }

    const releases = (await res.json()) as GhRelease[];
    if (!Array.isArray(releases) || releases.length === 0) {
      return { urls: fallback, source: 'fallback', tokenPresent };
    }

    const sorted = [...releases].sort((a, b) => compareTagVersions(b.tag_name, a.tag_name));

    for (const release of sorted) {
      const assets = release?.assets ?? [];
      const win = assets.find((a) => a.name.endsWith('.exe'))?.browser_download_url ?? null;
      const mac = assets.find((a) => a.name.endsWith('.dmg'))?.browser_download_url ?? null;
      const linux = assets.find((a) => a.name.endsWith('.AppImage'))?.browser_download_url ?? null;
      if (win || mac || linux) {
        return { urls: { win, mac, linux }, source: 'github-api', latestTag: release.tag_name, tokenPresent };
      }
    }
  } catch {
    // Network or parse error; use fallback
  }

  return { urls: fallback, source: 'fallback', tokenPresent };
}
