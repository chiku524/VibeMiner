export default function NetworksLoading() {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-gray-400">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm">Loading networks…</p>
    </div>
  );
}
