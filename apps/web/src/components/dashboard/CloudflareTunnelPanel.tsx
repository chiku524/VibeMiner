'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useToast } from '@/contexts/ToastContext';
import { Globe, Loader2 } from 'lucide-react';

const MAX_LINES = 400;

type StreamKind = 'stdout' | 'stderr' | 'meta';

type TunnelLogPayload = {
  stream: StreamKind;
  line: string;
};

function asStream(s: string): StreamKind {
  if (s === 'stderr' || s === 'meta') return s;
  return 'stdout';
}

type CloudflareTunnelPanelProps = {
  /** Render inside a Boing node session card instead of the sidebar. */
  embedded?: boolean;
};

/**
 * Start/stop Cloudflare Tunnel from the desktop app (optional). Requires `cloudflared`
 * and `~/.cloudflared/config.yml` (see Boing Network infrastructure docs).
 */
export function CloudflareTunnelPanel({ embedded = false }: CloudflareTunnelPanelProps) {
  const isDesktop = useIsDesktop();
  const { addToast } = useToast();
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<Array<{ stream: StreamKind; text: string }>>([]);
  const preRef = useRef<HTMLPreElement>(null);

  const syncRunning = useCallback(async () => {
    const fn = window.desktopAPI?.isCloudflareTunnelRunning;
    if (!fn) return;
    try {
      const v = await fn();
      setRunning(v === true);
    } catch {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    void syncRunning();
    const id = setInterval(() => void syncRunning(), 3000);
    return () => clearInterval(id);
  }, [isDesktop, syncRunning]);

  useEffect(() => {
    if (!isDesktop || typeof window === 'undefined') return;
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void (async () => {
      try {
        const snap = window.desktopAPI?.getCloudflareTunnelLogSnapshot;
        if (snap) {
          const rows = await snap();
          if (cancelled || !Array.isArray(rows)) return;
          setLines(
            rows.map((r) => ({
              stream: asStream(typeof r.stream === 'string' ? r.stream : 'stdout'),
              text: typeof r.line === 'string' ? r.line : String(r.line ?? ''),
            }))
          );
        }
      } catch {
        void 0;
      }

      if (cancelled || typeof window.__TAURI__ === 'undefined') return;
      try {
        const { listen } = await import('@tauri-apps/api/event');
        if (cancelled) return;
        unlisten = await listen<TunnelLogPayload>('cloudflared-output', (event) => {
          const p = event.payload;
          setLines((prev) => {
            const next = [...prev, { stream: asStream(p.stream), text: p.line }];
            if (next.length > MAX_LINES) next.splice(0, next.length - MAX_LINES);
            return next;
          });
        });
      } catch {
        void 0;
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [isDesktop]);

  useEffect(() => {
    const el = preRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const handleStart = async () => {
    const fn = window.desktopAPI?.startCloudflareTunnel;
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn();
      addToast('Cloudflare tunnel starting…', 'info');
      await syncRunning();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast(msg || 'Could not start tunnel', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    const fn = window.desktopAPI?.stopCloudflareTunnel;
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn();
      addToast('Tunnel stopped', 'info');
      setRunning(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast(msg || 'Could not stop tunnel', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!isDesktop || typeof window === 'undefined' || !window.desktopAPI?.startCloudflareTunnel) {
    return null;
  }

  return (
    <section className="mb-4 rounded-xl border border-orange-500/25 bg-surface-900/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-orange-200/90" aria-hidden />
          <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-orange-200/90">
            Public RPC tunnel
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {running ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Running
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStop()}
                className="rounded-md border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-50"
              >
                {busy ? '…' : 'Stop'}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleStart()}
              className="flex items-center gap-1.5 rounded-md border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-[11px] font-medium text-orange-200 hover:bg-orange-500/25 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {busy ? 'Starting…' : 'Start'}
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-gray-500">
        {embedded ? (
          <>
            <code className="rounded bg-white/10 px-1 font-mono text-[10px]">cloudflared</code> exposes this session’s local RPC.
            The desktop app usually starts/stops the tunnel with the Boing node; use the buttons here to override.{' '}
            <a href="/dashboard/settings" className="text-accent-cyan hover:underline">
              Settings
            </a>
            .
          </>
        ) : (
          <>
            <code className="rounded bg-white/10 px-1 font-mono text-[10px]">cloudflared</code> exposes local RPC (e.g.{' '}
            <strong className="font-medium text-gray-400">8545</strong>). By default, starting a Boing node starts this tunnel if it
            is not already running; stopping the node stops a tunnel the app started. You can still start or stop manually here.
            Paths, tunnel name, and the pairing toggle:{' '}
            <a href="/dashboard/settings" className="text-accent-cyan hover:underline">
              Settings
            </a>
            .
          </>
        )}
      </p>

      <details className="mt-2 border-t border-white/5 pt-2">
        <summary className="cursor-pointer select-none text-[11px] text-gray-500 hover:text-gray-400">
          DNS / tunnel errors (e.g. region1.v2.argotunnel.com timeout)
        </summary>
        <p className="mt-1.5 text-[11px] leading-snug text-gray-500">
          Usually VPN split-DNS, firewall, or ISP resolver. Try DNS <code className="font-mono text-[10px]">1.1.1.1</code> or
          VPN off. Unrelated to the Boing node — use <strong className="font-medium text-gray-400">Node output</strong> for
          node crashes.
        </p>
      </details>

      <details className="mt-1 border-t border-white/5 pt-2">
        <summary className="cursor-pointer select-none text-[11px] text-gray-500 hover:text-gray-400">
          Tunnel log
        </summary>
        <pre
          ref={preRef}
          className="mt-1.5 max-h-32 overflow-auto rounded-md border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-gray-300"
        >
          {lines.length === 0 ? (
            <span className="text-gray-600">No output yet.</span>
          ) : (
            lines.map((row, i) => (
              <span key={i} className={row.stream === 'stderr' ? 'text-amber-200/90' : undefined}>
                {row.text}
                {'\n'}
              </span>
            ))
          )}
        </pre>
      </details>
    </section>
  );
}
