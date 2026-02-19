import { NextResponse } from 'next/server';
import { getLatestDesktopDownloadUrls } from '@/lib/desktop-downloads-api';

/**
 * GET /api/desktop-downloads
 * Fetches the latest GitHub release and returns download URLs for Windows (.exe), macOS (.dmg), Linux (.AppImage).
 * Env: GITHUB_REPO or GITHUB_URL (e.g. https://github.com/owner/repo), optional GITHUB_TOKEN.
 */
export async function GET() {
  try {
    const urls = await getLatestDesktopDownloadUrls();
    const hasAny = urls.win || urls.mac || urls.linux;
    if (!hasAny) {
      return NextResponse.json(
        { error: 'Failed to fetch latest release' },
        { status: 502 }
      );
    }
    return NextResponse.json(urls, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch latest release' },
      { status: 500 }
    );
  }
}
