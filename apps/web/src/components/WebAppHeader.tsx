'use client';

import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { BrandMark } from '@/components/BrandMark';

export type WebAppHeaderLink = {
  href: string;
  label: string;
};

type WebAppHeaderProps = {
  homeHref?: string;
  links?: WebAppHeaderLink[];
  /** Pulse placeholders instead of nav links (loading fallbacks) */
  loading?: boolean;
};

export function WebAppHeader({ homeHref = '/home', links = [], loading = false }: WebAppHeaderProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-white/10" aria-hidden />
        ) : (
          <Link href={homeHref} className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold">
            <BrandMark className="h-6 w-6 shrink-0" />
            <span className="truncate bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
              VibeMiner
            </span>
          </Link>
        )}
        {loading ? (
          <div className="h-4 w-20 animate-pulse rounded bg-white/10" aria-hidden />
        ) : links.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="text-sm text-gray-400 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
