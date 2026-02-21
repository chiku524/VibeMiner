export default function SettingsLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm text-gray-400">Loading settings…</p>
    </div>
  );
}
