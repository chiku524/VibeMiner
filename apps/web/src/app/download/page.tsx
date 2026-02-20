import { getLatestDesktopDownloadUrls, getRepoFromEnv } from '@/lib/desktop-downloads-api';
import { DownloadPageGate } from './DownloadPageGate';

export const dynamic = 'force-dynamic';

export default async function DownloadPage() {
  const { urls: initialDownloads } = await getLatestDesktopDownloadUrls();
  const repo = getRepoFromEnv();
  const githubReleasesUrl = `https://github.com/${repo}/releases/latest`;
  return (
    <DownloadPageGate
      initialDownloads={initialDownloads}
      githubReleasesUrl={githubReleasesUrl}
    />
  );
}
