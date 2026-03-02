import { Suspense } from 'react';
import { WorkspaceContent } from '../WorkspaceContent';
import { DashboardFallback } from '../DashboardFallback';

export default function MiningPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <WorkspaceContent mode="mining" />
    </Suspense>
  );
}
