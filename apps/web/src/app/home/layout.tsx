import { site } from '@/lib/site';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Home',
  description: 'VibeMiner — your home for mining and network management.',
  alternates: { canonical: `${base}/home` },
  robots: { index: false },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
