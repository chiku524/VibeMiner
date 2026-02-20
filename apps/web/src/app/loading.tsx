export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-surface-950" aria-hidden>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
    </div>
  );
}
