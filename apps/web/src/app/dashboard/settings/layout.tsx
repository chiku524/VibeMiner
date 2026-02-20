import { site } from '@/lib/site';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Settings',
  description: 'User settings for VibeMiner — desktop app, auto-updates, and more.',
  alternates: { canonical: `${base}/dashboard/settings` },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
