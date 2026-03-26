'use client';

import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mt-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm"
    >
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex min-w-0 max-w-full items-center gap-2">
          {i > 0 && <span className="shrink-0 text-gray-600">/</span>}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="min-w-0 break-words text-gray-400 transition hover:text-white"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="min-w-0 break-words text-white">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
