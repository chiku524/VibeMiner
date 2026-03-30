'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

type TunnelSettingsState = {
  cloudflaredPath: string;
  cloudflareTunnelName: string;
  cloudflareConfigPath: string;
  linkTunnelWithBoingNode: boolean;
  effectiveConfigPath: string;
  resolvedCloudflaredPath: string;
};

const emptyState: TunnelSettingsState = {
  cloudflaredPath: '',
  cloudflareTunnelName: 'boing-testnet-rpc',
  cloudflareConfigPath: '',
  linkTunnelWithBoingNode: true,
  effectiveConfigPath: '',
  resolvedCloudflaredPath: '',
};

export function CloudflareTunnelSettings() {
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TunnelSettingsState>(emptyState);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.desktopAPI?.getTunnelSettings) return;
    window.desktopAPI
      .getTunnelSettings()
      .then((s) => {
        setForm({
          cloudflaredPath: typeof s.cloudflaredPath === 'string' ? s.cloudflaredPath : '',
          cloudflareTunnelName:
            typeof s.cloudflareTunnelName === 'string' && s.cloudflareTunnelName.trim()
              ? s.cloudflareTunnelName
              : 'boing-testnet-rpc',
          cloudflareConfigPath: typeof s.cloudflareConfigPath === 'string' ? s.cloudflareConfigPath : '',
          linkTunnelWithBoingNode:
            typeof s.linkTunnelWithBoingNode === 'boolean' ? s.linkTunnelWithBoingNode : true,
          effectiveConfigPath: typeof s.effectiveConfigPath === 'string' ? s.effectiveConfigPath : '',
          resolvedCloudflaredPath:
            typeof s.resolvedCloudflaredPath === 'string' ? s.resolvedCloudflaredPath : '',
        });
      })
      .catch(() => setForm(emptyState))
      .finally(() => setLoading(false));
  }, [mounted]);

  if (!mounted || typeof window === 'undefined' || !window.desktopAPI?.getTunnelSettings) {
    return null;
  }

  const handleSave = async () => {
    if (!window.desktopAPI?.setTunnelSettings || saving) return;
    setSaving(true);
    try {
      await window.desktopAPI.setTunnelSettings({
        cloudflaredPath: form.cloudflaredPath.trim(),
        cloudflareTunnelName: form.cloudflareTunnelName.trim() || 'boing-testnet-rpc',
        cloudflareConfigPath: form.cloudflareConfigPath.trim(),
        linkTunnelWithBoingNode: form.linkTunnelWithBoingNode,
      });
      const s = await window.desktopAPI.getTunnelSettings!();
      setForm((f) => ({
        ...f,
        effectiveConfigPath: typeof s.effectiveConfigPath === 'string' ? s.effectiveConfigPath : f.effectiveConfigPath,
        resolvedCloudflaredPath:
          typeof s.resolvedCloudflaredPath === 'string' ? s.resolvedCloudflaredPath : f.resolvedCloudflaredPath,
      }));
      addToast('Tunnel settings saved', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-500/20 bg-surface-900/30 px-4 py-3">
      <p className="text-sm font-medium text-white">Public RPC tunnel (Cloudflare)</p>
      <p className="mt-1 text-xs text-gray-500">
        Optional. Exposes local JSON-RPC (e.g. Boing testnet on :8545). Your{' '}
        <code className="rounded bg-amber-500/15 px-1 text-amber-200/90">%USERPROFILE%\.cloudflared\config.yml</code>{' '}
        <strong className="text-amber-200/90">ingress</strong> must route{' '}
        <code className="rounded bg-white/10 px-1">testnet-rpc.boing.network</code> →{' '}
        <code className="rounded bg-white/10 px-1">http://127.0.0.1:8545</code> (set in Cloudflare Zero Trust → Tunnels → public hostname). A Pages “custom domain” alone causes <strong className="text-amber-200/90">HTTP 405</strong> on POST — see Boing doc{' '}
        <a
          href="https://github.com/chiku524/boing.network/blob/main/docs/CLOUDFLARED-TUNNEL-ALIGNMENT.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-cyan underline-offset-2 hover:underline"
        >
          CLOUDFLARED-TUNNEL-ALIGNMENT.md
        </a>
        . When enabled below, starting a Boing node starts this tunnel if it is not already running; stopping the node stops a tunnel the app started for you. Same layout as{' '}
        <code className="rounded bg-white/10 px-1">boing.network/scripts/start-cloudflare-tunnel.bat</code>: credentials in{' '}
        <code className="rounded bg-white/10 px-1">%USERPROFILE%\.cloudflared\config.yml</code> (or{' '}
        <code className="rounded bg-white/10 px-1">~/.cloudflared/config.yml</code>), binary often at{' '}
        <code className="rounded bg-white/10 px-1">boing.network/.cloudflared/cloudflared</code>. The app also checks{' '}
        <code className="rounded bg-white/10 px-1">BOING_NETWORK_ROOT</code> and a sibling{' '}
        <code className="rounded bg-white/10 px-1">boing.network</code> folder before PATH.
      </p>
      {loading ? (
        <p className="mt-3 text-xs text-gray-500">Loading…</p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={form.linkTunnelWithBoingNode}
              onChange={(e) => setForm((f) => ({ ...f, linkTunnelWithBoingNode: e.target.checked }))}
              className="mt-0.5 rounded border-white/20 bg-surface-850 text-orange-500 focus:ring-orange-500/40"
            />
            <span>
              Start/stop Cloudflare tunnel with Boing node (recommended if this PC serves the public testnet RPC).
            </span>
          </label>
          <div>
            <label htmlFor="cf-tunnel-name" className="block text-xs font-medium text-gray-400">
              Tunnel name
            </label>
            <input
              id="cf-tunnel-name"
              value={form.cloudflareTunnelName}
              onChange={(e) => setForm((f) => ({ ...f, cloudflareTunnelName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-500/40 focus:outline-none"
              placeholder="boing-testnet-rpc"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="cf-config-path" className="block text-xs font-medium text-gray-400">
              Config file (optional)
            </label>
            <input
              id="cf-config-path"
              value={form.cloudflareConfigPath}
              onChange={(e) => setForm((f) => ({ ...f, cloudflareConfigPath: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-3 py-2 font-mono text-xs text-white placeholder-gray-600 focus:border-orange-500/40 focus:outline-none"
              placeholder="Default: %USERPROFILE%\.cloudflared\config.yml"
              autoComplete="off"
            />
            {form.effectiveConfigPath ? (
              <p className="mt-1 text-[11px] text-gray-600">
                Effective config: <span className="font-mono text-gray-500">{form.effectiveConfigPath}</span>
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="cf-exe-path" className="block text-xs font-medium text-gray-400">
              cloudflared.exe path (optional)
            </label>
            <input
              id="cf-exe-path"
              value={form.cloudflaredPath}
              onChange={(e) => setForm((f) => ({ ...f, cloudflaredPath: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-3 py-2 font-mono text-xs text-white placeholder-gray-600 focus:border-orange-500/40 focus:outline-none"
              placeholder="Empty: Boing repo .cloudflared, BOING_NETWORK_ROOT, then PATH"
              autoComplete="off"
            />
            {form.resolvedCloudflaredPath ? (
              <p className="mt-1 text-[11px] text-gray-600">
                Resolved binary: <span className="font-mono text-gray-500">{form.resolvedCloudflaredPath}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-600">
                Resolved binary: <span className="text-gray-500">not found (set path or install cloudflared)</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-200 hover:bg-orange-500/30 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save tunnel settings'}
          </button>
        </div>
      )}
    </div>
  );
}
