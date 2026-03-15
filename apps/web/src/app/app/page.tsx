'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Legacy /app route: redirects to the unified Home page.
 */
export default function AppLauncherPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return null;
}
