import { site } from '@/lib/site';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Admin',
  description: 'VibeMiner admin dashboard — platform stats and wallet.',
  alternates: { canonical: `${base}/dashboard/admin` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
