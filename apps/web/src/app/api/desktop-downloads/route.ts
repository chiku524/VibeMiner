import { NextResponse } from 'next/server';
import { getLatestDesktopDownloadUrls } from '@/lib/desktop-downloads-api';

/**
 * GET /api/desktop-downloads
 * Fetches the latest GitHub release and returns download URLs for Windows (.exe), macOS (.dmg), Linux (.AppImage).
 * Env: GITHUB_REPO or GITHUB_URL (e.g. https://github.com/owner/repo), optional GITHUB_TOKEN.
 */
export async function GET() {
  try {
    const result = await getLatestDesktopDownloadUrls();
    const { urls, source, latestTag, tokenPresent, githubStatus, githubMessage } = result;
    const hasAny = urls.win || urls.mac || urls.linux;
    if (!hasAny) {
      return NextResponse.json(
        { error: 'Failed to fetch latest release' },
        { status: 502 }
      );
    }
    const body: Record<string, unknown> = { ...urls, source, tokenPresent };
    if (latestTag) body.latestTag = latestTag;
    if (source === 'fallback' && githubStatus != null) body.githubStatus = githubStatus;
    if (source === 'fallback' && githubMessage) body.githubMessage = githubMessage;
    const isFallback = source === 'fallback';
    return NextResponse.json(body, {
      headers: {
        'Cache-Control': isFallback
          ? 'no-store, must-revalidate'
          : 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Download-Source': source,
        'X-GitHub-Authenticated': tokenPresent ? 'true' : 'false',
        ...(latestTag && { 'X-Download-Version': latestTag }),
        ...(githubStatus != null && { 'X-GitHub-Status': String(githubStatus) }),
        ...(githubMessage && { 'X-GitHub-Message': githubMessage }),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch latest release' },
      { status: 500 }
    );
  }
}
