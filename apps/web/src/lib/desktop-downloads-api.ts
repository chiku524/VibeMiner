/**
 * Server-side only: fetches latest GitHub release and returns desktop download URLs.
 * Used by the API route and by the download page for initial (SSR) data so the
 * first paint shows the latest release, not build-time env fallback.
 */

function getRepoFromEnv(): string {
  const repo = process.env.GITHUB_REPO;
  if (repo) return repo.trim();
  const url = process.env.GITHUB_URL;
  if (url) {
    const t = url.trim();
    if (/^[\w.-]+\/[\w.-]+$/.test(t)) return t;
    const m = t.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
    if (m) return `${m[1]}/${m[2]}`;
  }
  return 'chiku524/crypto-miner';
}

export type DesktopDownloadUrls = {
  win: string | null;
  mac: string | null;
  linux: string | null;
};

export async function getLatestDesktopDownloadUrls(): Promise<DesktopDownloadUrls> {
  const repo = getRepoFromEnv();
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    return { win: null, mac: null, linux: null };
  }

  const release = (await res.json()) as { assets?: Array<{ name: string; browser_download_url: string }> };
  const assets = release?.assets ?? [];

  const win = assets.find((a) => a.name.endsWith('.exe'))?.browser_download_url ?? null;
  const mac = assets.find((a) => a.name.endsWith('.dmg'))?.browser_download_url ?? null;
  const linux = assets.find((a) => a.name.endsWith('.AppImage'))?.browser_download_url ?? null;

  return { win, mac, linux };
}
