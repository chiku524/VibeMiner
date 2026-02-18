import { getLatestDesktopDownloadUrls } from '@/lib/desktop-downloads-api';
import { DownloadPageContent } from './DownloadPageContent';

export default async function DownloadPage() {
  const initialDownloads = await getLatestDesktopDownloadUrls();
  return <DownloadPageContent initialDownloads={initialDownloads} />;
}
