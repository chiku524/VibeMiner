import { site } from '@/lib/site';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'App',
  description: 'VibeMiner — choose where to go.',
  alternates: { canonical: `${base}/app` },
  robots: { index: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
