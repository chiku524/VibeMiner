'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/auth';

function getReturnTo(searchParams: ReturnType<typeof useSearchParams>): string {
  const returnTo = searchParams.get('returnTo');
  if (!returnTo || typeof returnTo !== 'string') return '/dashboard';
  if (!returnTo.startsWith('/')) return '/dashboard';
  return returnTo;
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = useMemo(() => getReturnTo(searchParams), [searchParams]);

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!emailRe.test(email)) next.email = 'Please enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    router.push(returnTo);
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface-900/50 p-8"
    >
      <Link href="/" className="mb-6 inline-flex items-center gap-2 font-display text-lg font-semibold text-gray-300 hover:text-white">
        <span className="text-xl" aria-hidden="true">◇</span>
        VibeMiner
      </Link>
      <h1 className="font-display text-2xl font-bold text-white">Sign in</h1>
      <p className="mt-1 text-sm text-gray-400">Access your miner or network account.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-400">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
            required
            className={`mt-1 w-full rounded-lg border bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
              fieldErrors.email ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-accent-cyan/50 focus:ring-accent-cyan/50'
            }`}
            placeholder="you@example.com"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email && <p id="login-email-error" className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-400">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
            required
            className={`mt-1 w-full rounded-lg border bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
              fieldErrors.password ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-accent-cyan/50 focus:ring-accent-cyan/50'
            }`}
            placeholder="••••••••"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
          />
          {fieldErrors.password && <p id="login-password-error" className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
        </div>
        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
            <span className="mt-1 block text-xs text-gray-500">
              {error.includes('temporarily unavailable') || error.includes('contact support')
                ? 'If this keeps happening, try again in a moment or contact support.'
                : 'Check your email and password, or try again.'}
            </span>
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent-cyan py-2.5 font-medium text-surface-950 transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href={`/register${returnTo !== '/dashboard' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-accent-cyan hover:underline">Register</Link>
      </p>
    </motion.div>
  );
}
