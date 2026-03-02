import { Suspense } from 'react';
import { WorkspaceContent } from '../WorkspaceContent';
import { DashboardFallback } from '../DashboardFallback';

export default function NodesPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <WorkspaceContent mode="nodes" />
    </Suspense>
  );
}
