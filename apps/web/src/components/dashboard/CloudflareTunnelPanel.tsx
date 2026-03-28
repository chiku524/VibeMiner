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

/**
 * Start/stop Cloudflare Tunnel from the desktop app (optional). Requires `cloudflared`
 * and `~/.cloudflared/config.yml` (see Boing Network infrastructure docs).
 */
export function CloudflareTunnelPanel() {
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
    <section className="mb-6 rounded-2xl border border-orange-500/25 bg-surface-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-orange-200/90">
            <Globe className="h-4 w-4 shrink-0" aria-hidden />
            Public RPC (Cloudflare Tunnel)
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Run <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">cloudflared</code> to expose
            local JSON-RPC (port from your node template, often <strong>8545</strong>) at your public hostname — e.g.{' '}
            <code className="font-mono text-[11px] text-gray-300">testnet-rpc.boing.network</code>. Start the node first,
            then start the tunnel. Configure paths and tunnel name in{' '}
            <a href="/dashboard/settings" className="text-accent-cyan hover:underline">
              Settings
            </a>
            .
          </p>
          <p className="mt-2 text-xs text-gray-500">
            If logs show{' '}
            <code className="rounded bg-white/5 px-1 font-mono text-[10px] text-gray-400">
              Failed to initialize DNS local resolver
            </code>{' '}
            or timeouts resolving{' '}
            <code className="font-mono text-[10px] text-gray-400">region1.v2.argotunnel.com</code>, your PC cannot reach a
            resolver (VPN split-DNS, corporate firewall, or ISP DNS). Try setting DNS to Cloudflare (
            <code className="font-mono text-[10px]">1.1.1.1</code>) or temporarily disabling the VPN. That message is
            separate from the Boing node: if the node stops after a few seconds, open <strong>Node output</strong> on the
            running-node panel for the real exit reason.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {running ? (
            <>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Running
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStop()}
                className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-50"
              >
                {busy ? '…' : 'Stop tunnel'}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleStart()}
              className="flex items-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-200 hover:bg-orange-500/25 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {busy ? 'Starting…' : 'Start tunnel'}
            </button>
          )}
        </div>
      </div>

      <details className="mt-4 border-t border-white/5 pt-3">
        <summary className="cursor-pointer select-none text-xs text-gray-500 hover:text-gray-400">
          Tunnel log (cloudflared stdout/stderr)
        </summary>
        <pre
          ref={preRef}
          className="mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-gray-300"
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
