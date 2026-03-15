'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { User, Building2, Globe } from 'lucide-react';

export function ProfileSettings() {
  const { user, accountType, refreshSession } = useAuth();
  const { addToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [networkWebsite, setNetworkWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name ?? '');
      setNetworkName(user.network_name ?? '');
      setNetworkWebsite(user.network_website ?? '');
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const result = await updateProfile({
      displayName: displayName.trim() || null,
      networkName: accountType === 'network' ? (networkName.trim() || null) : undefined,
      networkWebsite: accountType === 'network' ? (networkWebsite.trim() || null) : undefined,
    });
    setSaving(false);
    if ('error' in result) {
      addToast(result.error, 'error');
      return;
    }
    addToast('Profile updated');
    await refreshSession();
  }

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile-display-name" className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <User className="h-4 w-4" />
          Display name
        </label>
        <input
          id="profile-display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Miner or network alias"
          maxLength={128}
          className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
        />
        <p className="mt-1 text-xs text-gray-500">Shown as your alias (miner or network).</p>
      </div>

      {accountType === 'network' && (
        <>
          <div>
            <label htmlFor="profile-network-name" className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <Building2 className="h-4 w-4" />
              Network name
            </label>
            <input
              id="profile-network-name"
              type="text"
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              placeholder="Your blockchain or project name"
              maxLength={128}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>
          <div>
            <label htmlFor="profile-network-website" className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <Globe className="h-4 w-4" />
              Network website
            </label>
            <input
              id="profile-network-website"
              type="url"
              value={networkWebsite}
              onChange={(e) => setNetworkWebsite(e.target.value)}
              placeholder="https://..."
              maxLength={256}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
            <p className="mt-1 text-xs text-gray-500">Public URL for your project. Must be http or https.</p>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent-cyan/20 px-4 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
