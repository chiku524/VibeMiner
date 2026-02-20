/**
 * Client-side auth API. Calls /api/auth/* endpoints.
 * Auth is configured when the app is deployed to Cloudflare (D1 + KV bindings).
 */
export type AccountType = 'user' | 'network';

export interface User {
  id: string;
  email: string;
  account_type: AccountType;
  display_name: string | null;
  network_name: string | null;
  network_website: string | null;
  created_at: string;
  updated_at: string;
  /** True if user is in admin_users; can access admin dashboard. */
  is_admin?: boolean;
}

export interface AuthResponse {
  user: User | null;
}

const API = '/api/auth';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  return url ? `https://${url}` : 'http://localhost:3000';
}

export async function fetchSession(): Promise<AuthResponse> {
  const res = await fetch(`${getBaseUrl()}${API}/session`, { credentials: 'include' });
  if (!res.ok) return { user: null };
  return res.json();
}

export async function login(email: string, password: string): Promise<{ user: User } | { error: string }> {
  const res = await fetch(`${getBaseUrl()}${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as { error?: string; user?: User };
  if (!res.ok) return { error: data.error ?? 'Login failed' };
  return { user: data.user! };
}

export async function register(params: {
  email: string;
  password: string;
  accountType: AccountType;
  displayName?: string;
  networkName?: string;
  networkWebsite?: string;
}): Promise<{ user: User } | { error: string }> {
  const res = await fetch(`${getBaseUrl()}${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      accountType: params.accountType,
      displayName: params.displayName,
      networkName: params.networkName,
      networkWebsite: params.networkWebsite,
    }),
  });
  const data = (await res.json()) as { error?: string; user?: User };
  if (!res.ok) return { error: data.error ?? 'Registration failed' };
  return { user: data.user! };
}

export async function logout(): Promise<void> {
  await fetch(`${getBaseUrl()}${API}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
