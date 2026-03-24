import { MiningLoader } from '@/components/ui/MiningLoader';

export default function NetworksLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <MiningLoader size="md" label="Loading networks…" />
    </div>
  );
}
