'use client';

import { Suspense } from 'react';
import { DashboardContent } from './DashboardContent';

function DashboardFallback() {
  return (
    <main className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
