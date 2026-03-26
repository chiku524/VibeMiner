'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/BrandMark';
import { site } from '@/lib/site';
import './desktop-launch.css';

/**
 * Main window entry (BountyHub / dice.express): brief “Opening…” then hand off to / for auth + shell.
 */
export default function DesktopLaunchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="desktop-launch-screen">
      <div className="desktop-launch-screen__bg" aria-hidden />
      <div className="desktop-launch-screen__content">
        <div className="desktop-launch-screen__logo-wrap">
          <BrandMark className="mx-auto h-[72px] w-[72px]" />
        </div>
        <h1 className="desktop-launch-screen__title">{site.name}</h1>
        <p className="desktop-launch-screen__step">Opening…</p>
      </div>
    </div>
  );
}
