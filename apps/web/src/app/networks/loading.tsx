export default function NetworksLoading() {
  return (
    <div className="min-h-screen bg-surface-950 bg-grid flex flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm text-gray-400">Loading networks…</p>
    </div>
  );
}
