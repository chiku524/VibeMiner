'use client';

import { useCallback, useState } from 'react';
import {
  BOING_LOCAL_RPC_DEFAULT,
  BOING_TESTNET_PUBLIC_RPC_URL,
  BOING_TESTNET_TOOLKIT_LINKS,
  type BoingToolkitLink,
} from '@vibeminer/shared';
import { ClipboardCheck, ClipboardCopy, FlaskConical, Link2 } from 'lucide-react';

type Variant = 'modal' | 'compact';

function normalizeRpcUrl(s: string): string {
  return s.replace(/\/+$/, '');
}

export function BoingTestnetToolkit({ variant = 'modal' }: { variant?: Variant }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  const isCompact = variant === 'compact';
  const box = isCompact
    ? 'rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5'
    : 'rounded-xl border border-sky-500/25 bg-sky-500/5 p-4';

  return (
    <div className={box}>
      <div className="flex items-center gap-2 text-sky-200/95">
        <FlaskConical className={`shrink-0 ${isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} aria-hidden />
        <h3 className={`font-display font-semibold uppercase tracking-wider ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
          Testnet: tokens, contracts &amp; NFTs
        </h3>
      </div>
      <p className={`mt-2 text-gray-400 ${isCompact ? 'text-[10px] leading-snug' : 'text-[11px] leading-relaxed'}`}>
        Boing uses the Boing VM (not EVM). Use the{' '}
        <strong className="font-medium text-gray-300">SDK</strong> +{' '}
        <strong className="font-medium text-gray-300">Boing Express</strong> (or Hub) to sign deploys; run this node for{' '}
        <code className="rounded bg-black/30 px-1 font-mono text-gray-300">localhost:8545</code>. The{' '}
        <strong className="font-medium text-gray-300">public RPC</strong> powers the faucet and (when upgraded) observer QA
        — see links below.
      </p>

      <div className={`mt-3 space-y-2 ${isCompact ? '' : 'sm:flex sm:flex-wrap sm:gap-2 sm:space-y-0'}`}>
        <CopyRpcRow
          label="Public RPC"
          value={normalizeRpcUrl(BOING_TESTNET_PUBLIC_RPC_URL) + '/'}
          copied={copied}
          onCopy={copy}
          compact={isCompact}
        />
        <CopyRpcRow
          label="Local RPC (this PC)"
          value={BOING_LOCAL_RPC_DEFAULT}
          copied={copied}
          onCopy={copy}
          compact={isCompact}
        />
      </div>

      <ul className={`mt-3 space-y-1.5 border-t border-white/5 pt-3 ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
        {BOING_TESTNET_TOOLKIT_LINKS.map((item: BoingToolkitLink) => (
          <li key={item.href} className="leading-snug">
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-sky-400 underline-offset-2 hover:underline"
            >
              <Link2 className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              {item.label}
            </a>
            {item.hint ? <span className="mt-0.5 block text-gray-500">{item.hint}</span> : null}
          </li>
        ))}
      </ul>

      <p className={`mt-3 border-t border-white/5 pt-3 text-amber-200/90 ${isCompact ? 'text-[10px] leading-snug' : 'text-[11px] leading-relaxed'}`}>
        If <strong className="font-medium text-amber-100">boing.observer/qa</strong> shows{' '}
        <strong className="font-medium">Method not found</strong>, the node behind{' '}
        <code className="rounded bg-black/30 px-1 font-mono text-amber-100/90">testnet-rpc.boing.network</code> must be
        rebuilt from current <strong className="font-medium">boing.network</strong> main and restarted (tunnel unchanged).
        Your VibeMiner node does not replace that endpoint for the live site.
      </p>
    </div>
  );
}

function CopyRpcRow({
  label,
  value,
  copied,
  onCopy,
  compact,
}: {
  label: string;
  value: string;
  copied: string | null;
  onCopy: (label: string, text: string) => void;
  compact: boolean;
}) {
  const done = copied === label;
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 ${
        compact ? 'flex-wrap' : 'sm:flex-1 sm:min-w-[200px]'
      }`}
    >
      <span className={`shrink-0 text-gray-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{label}</span>
      <code className={`min-w-0 flex-1 truncate font-mono text-gray-300 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        {value}
      </code>
      <button
        type="button"
        onClick={() => onCopy(label, value)}
        className="shrink-0 rounded border border-white/15 p-1 text-gray-400 transition hover:border-sky-500/40 hover:text-sky-300"
        title="Copy URL"
        aria-label={`Copy ${label}`}
      >
        {done ? <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
