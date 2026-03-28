'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';

type StreamKind = 'stdout' | 'stderr' | 'meta';

type NodeLogPayload = {
  networkId: string;
  environment: string;
  nodePresetId: string;
  stream: StreamKind;
  line: string;
};

const MAX_LINES = 500;

function asStreamKind(s: string): StreamKind {
  if (s === 'stderr' || s === 'meta') return s;
  return 'stdout';
}

function logBodyText(rows: Array<{ stream: StreamKind; text: string }>): string {
  return rows.map((r) => r.text).join('\n');
}

/**
 * Read-only “terminal” view: streams stdout/stderr from the desktop-spawned node process.
 * There is no shell and no way to run arbitrary commands — only output from the selected node.
 */
export function NodeProcessLog({
  networkId,
  environment,
  nodePresetId,
  /** When set (e.g. process exit time), pull the full ring from the desktop again so nothing is missed. */
  snapshotRefreshAt,
}: {
  networkId: string;
  environment: string;
  nodePresetId: string;
  snapshotRefreshAt?: number;
}) {
  const isDesktop = useIsDesktop();
  const preRef = useRef<HTMLPreElement>(null);
  const [lines, setLines] = useState<Array<{ stream: StreamKind; text: string }>>([]);
  const [logCopyHint, setLogCopyHint] = useState<string | null>(null);
  const [cmdCopyHint, setCmdCopyHint] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktop || typeof window === 'undefined') return;

    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void (async () => {
      setLines([]);
      try {
        const snap = window.desktopAPI?.getNodeLogSnapshot;
        if (snap) {
          const rows = await snap(networkId, environment, nodePresetId);
          if (cancelled || !Array.isArray(rows)) return;
          setLines(
            rows.map((r) => ({
              stream: asStreamKind(typeof r.stream === 'string' ? r.stream : 'stdout'),
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
        unlisten = await listen<NodeLogPayload>('node-process-output', (event) => {
          const p = event.payload;
          if (
            p.networkId !== networkId ||
            p.environment !== environment ||
            p.nodePresetId !== nodePresetId
          ) {
            return;
          }
          setLines((prev) => {
            const next = [...prev, { stream: p.stream, text: p.line }];
            if (next.length > MAX_LINES) {
              next.splice(0, next.length - MAX_LINES);
            }
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
  }, [isDesktop, networkId, environment, nodePresetId]);

  useEffect(() => {
    if (snapshotRefreshAt == null || !isDesktop || typeof window === 'undefined') return;
    const snap = window.desktopAPI?.getNodeLogSnapshot;
    if (!snap) return;
    let cancelled = false;
    void snap(networkId, environment, nodePresetId).then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      setLines(
        rows.map((r) => ({
          stream: asStreamKind(typeof r.stream === 'string' ? r.stream : 'stdout'),
          text: typeof r.line === 'string' ? r.line : String(r.line ?? ''),
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [snapshotRefreshAt, isDesktop, networkId, environment, nodePresetId]);

  useEffect(() => {
    const el = preRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const metaCommandLine = lines.find((r) => r.stream === 'meta')?.text ?? '';

  const handleCopy = useCallback(async () => {
    const text = logBodyText(lines);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setLogCopyHint('Copied');
      window.setTimeout(() => setLogCopyHint(null), 2000);
    } catch {
      setLogCopyHint('Failed');
      window.setTimeout(() => setLogCopyHint(null), 2000);
    }
  }, [lines]);

  const handleCopyCommand = useCallback(async () => {
    if (!metaCommandLine) return;
    try {
      await navigator.clipboard.writeText(metaCommandLine);
      setCmdCopyHint('Copied');
      window.setTimeout(() => setCmdCopyHint(null), 2000);
    } catch {
      setCmdCopyHint('Failed');
      window.setTimeout(() => setCmdCopyHint(null), 2000);
    }
  }, [metaCommandLine]);

  const handleDownload = useCallback(() => {
    const text = logBodyText(lines);
    if (!text) return;
    const safeNet = networkId.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const safePreset = nodePresetId.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `node-log-${safeNet}-${safePreset}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lines, networkId, nodePresetId]);

  if (!isDesktop) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0c1016]">
      <div className="flex flex-col gap-2 border-b border-white/10 bg-black/30 px-3 py-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-sky-300/90">Node output</p>
          <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
            Read-only output from the node process (not a shell). If you only see an exit code, copy the command
            above and run it in PowerShell — often <strong className="font-medium text-gray-400">port 8545 in use</strong>, a
            missing runtime DLL, or a bad flag. Block-buffered stdout may appear as one long line until flushed.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start">
          <button
            type="button"
            onClick={handleCopyCommand}
            disabled={!metaCommandLine}
            className="rounded border border-white/10 px-2 py-1 text-xs text-gray-400 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            title="Copy the resolved node command line"
          >
            {cmdCopyHint ?? 'Copy command'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={lines.length === 0}
            className="rounded border border-white/10 px-2 py-1 text-xs text-gray-400 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {logCopyHint ?? 'Copy log'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={lines.length === 0}
            className="rounded border border-white/10 px-2 py-1 text-xs text-gray-400 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download .txt
          </button>
          <button
            type="button"
            onClick={() => setLines([])}
            className="rounded border border-white/10 px-2 py-1 text-xs text-gray-400 transition hover:bg-white/5"
          >
            Clear view
          </button>
        </div>
      </div>
      <pre
        ref={preRef}
        className="max-h-72 overflow-auto p-3 font-mono text-[11px] leading-relaxed"
        aria-live="polite"
      >
        {lines.length === 0 ? (
          <span className="text-gray-600">Waiting for output…</span>
        ) : (
          lines.map((row, i) => (
            <span
              key={i}
              className={
                row.stream === 'stderr'
                  ? 'block text-red-300/90'
                  : row.stream === 'meta'
                    ? 'block text-amber-200/90'
                    : 'block text-emerald-100/85'
              }
            >
              {row.text}
              {'\n'}
            </span>
          ))
        )}
      </pre>
    </div>
  );
}
