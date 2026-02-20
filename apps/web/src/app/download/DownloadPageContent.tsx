'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { detectPlatform, type Platform } from '@/lib/downloads';
import type { DesktopDownloadUrls } from '@/lib/desktop-downloads-api';

const PLATFORM_LABELS: Record<Platform, string> = {
  win: 'Windows',
  mac: 'macOS',
  linux: 'Linux',
};

const PLATFORM_ICONS: Record<Platform, string> = {
  win: '🪟',
  mac: '🍎',
  linux: '🐧',
};

type DownloadUrls = { win: string | null; mac: string | null; linux: string | null };

interface DownloadPageContentProps {
  /** URLs from server (latest GitHub release) so first paint is correct */
  initialDownloads: DownloadUrls | null;
  /** Link when no installers are available (e.g. API failed) */
  githubReleasesUrl: string;
}

export function DownloadPageContent({ initialDownloads, githubReleasesUrl }: DownloadPageContentProps) {
  const isDesktop = useIsDesktop();
  const [suggested, setSuggested] = useState<Platform | null>(null);
  const [latest, setLatest] = useState<DownloadUrls | null>(initialDownloads);

  useEffect(() => {
    setSuggested(detectPlatform());
  }, []);

  useEffect(() => {
    fetch('/api/desktop-downloads')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        const urls = data as DesktopDownloadUrls | null;
        if (urls && (urls.win ?? urls.mac ?? urls.linux)) setLatest(urls);
      })
      .catch(() => {});
  }, []);

  // Use only API data (server or client fetch). Never use build-time env so we never show stale URLs.
  const downloads: DownloadUrls = {
    win: latest?.win ?? null,
    mac: latest?.mac ?? null,
    linux: latest?.linux ?? null,
  };

  const hasAnyDownload = downloads.win || downloads.mac || downloads.linux;

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Nav />
      <div className={`mx-auto max-w-2xl px-4 sm:px-6 ${isDesktop ? 'pt-14 pb-16' : 'py-16'}`}>
        <Breadcrumbs crumbs={[{ label: 'Home', href: isDesktop ? '/app' : '/' }, { label: 'Download' }]} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Download VibeMiner desktop
          </h1>
          <p className="mt-2 text-gray-400">
            Install the latest version on your computer for a dedicated mining experience. Same dashboard as the
            web—runs in its own window. Available for Windows, macOS (Apple Silicon), and Linux.
          </p>

          {hasAnyDownload ? (
            <div className="mt-10 space-y-4">
              {suggested && downloads[suggested] && (
                <p className="text-sm text-accent-cyan">
                  We detected {PLATFORM_LABELS[suggested]} — your download is below.
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {(['win', 'mac', 'linux'] as const).map((platform) => {
                  const url = downloads[platform];
                  if (!url) return null;
                  const isSuggested = suggested === platform;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-3 rounded-xl border px-5 py-4 font-medium transition ${
                        isSuggested
                          ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                          : 'border-white/10 bg-surface-900/50 text-gray-300 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-2xl" aria-hidden="true">{PLATFORM_ICONS[platform]}</span>
                      <span>
                        {PLATFORM_LABELS[platform]}
                        {isSuggested && (
                          <span className="ml-2 text-xs text-gray-500">(recommended)</span>
                        )}
                      </span>
                      <span className="text-gray-500">↓</span>
                    </a>
                  );
                })}
              </div>
              <p className="mt-6 text-sm text-gray-500">
                Buttons below open the latest release on GitHub (links always point to the newest version).{' '}
                <a href={githubReleasesUrl} target="_blank" rel="noopener noreferrer" className="text-accent-cyan underline">View all releases</a>.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                After installing, open VibeMiner and sign in with the same account you use on the
                web. Your dashboard and mining settings stay in sync.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                The desktop app checks for updates automatically. You can turn auto-updates on or off in the app (Dashboard → Desktop app settings).
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Built and published by <a href="https://nico.builds" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition">nico.builds</a>. Same app as the web—packaged for your OS.
              </p>
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-white/10 bg-surface-900/30 p-8">
              <p className="text-gray-400">
                Desktop installers are not yet available from this page. You can still use{' '}
                <Link href="/dashboard" className="text-accent-cyan underline">
                  the web app
                </Link>{' '}
                in your browser, or get the latest installers from{' '}
                <a
                  href={githubReleasesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-cyan underline"
                >
                  GitHub Releases
                </a>
                . Check back later or build from source—see the project README.
              </p>
            </div>
          )}
        </motion.div>
      </div>
      {!isDesktop && <Footer />}
    </main>
  );
}
