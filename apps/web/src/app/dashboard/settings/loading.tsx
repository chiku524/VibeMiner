import { MiningLoader } from '@/components/ui/MiningLoader';

export default function SettingsLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center py-24">
      <MiningLoader size="md" label="Loading settings…" />
    </div>
  );
}
