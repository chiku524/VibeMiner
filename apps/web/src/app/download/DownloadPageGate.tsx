'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DownloadPageContent } from './DownloadPageContent';

type DownloadUrls = { win: string | null; mac: string | null; linux: string | null };

interface DownloadPageGateProps {
  initialDownloads: DownloadUrls | null;
  githubReleasesUrl: string;
}

/**
 * In the desktop app, the download page is not shown — redirect to app home.
 * On web, renders the download page as usual.
 */
export function DownloadPageGate({ initialDownloads, githubReleasesUrl }: DownloadPageGateProps) {
  const isDesktop = useIsDesktop();
  const router = useRouter();

  useEffect(() => {
    if (isDesktop) {
      router.replace('/app');
    }
  }, [isDesktop, router]);

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-sm text-gray-400">Redirecting…</p>
        </div>
      </main>
    );
  }

  return (
    <DownloadPageContent
      initialDownloads={initialDownloads}
      githubReleasesUrl={githubReleasesUrl}
    />
  );
}
