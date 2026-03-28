import { site } from '@/lib/site';

/**
 * Instant shell while the splash route JS loads (remote URL in Tauri = network + bundle).
 * Matches page styling so the window is not a flat empty dark frame.
 */
export default function SplashLoading() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-8"
      style={{
        background:
          'radial-gradient(ellipse 95% 85% at 50% 38%, rgba(34, 211, 238, 0.08) 0%, rgba(16, 185, 129, 0.04) 45%, #0a0f14 72%)',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <div
        className="flex h-[72px] w-[72px] items-center justify-center rounded-[1.25rem]"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.22) 0%, rgba(16, 185, 129, 0.18) 100%)',
        }}
        aria-hidden
      />
      <p className="mt-4 text-center text-2xl font-bold text-slate-100">{site.name}</p>
      <p className="mt-1 text-center text-sm text-white/50">{site.slogan}</p>
    </div>
  );
}
