'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchSession, logout as apiLogout, type User } from '@/lib/auth';

type AccountType = 'user' | 'network';

type AuthState = {
  user: User | null;
  profile: User | null;
  accountType: AccountType | null;
  isAdmin: boolean;
  loading: boolean;
  configured: boolean;
};

const defaultState: AuthState = {
  user: null,
  profile: null,
  accountType: null,
  isAdmin: false,
  loading: true,
  configured: true,
};

const AuthContext = createContext<AuthState & { logout: () => Promise<void>; refreshSession: () => Promise<void> }>({
  ...defaultState,
  logout: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultState);

  const loadSession = useCallback(async () => {
    try {
      const { user } = await fetchSession();
      if (user) {
        setState({
          user,
          profile: user,
          accountType: user.account_type as AccountType,
          isAdmin: !!user.is_admin,
          loading: false,
          configured: true,
        });
      } else {
        setState({
          user: null,
          profile: null,
          accountType: null,
          isAdmin: false,
          loading: false,
          configured: true,
        });
      }
    } catch {
      setState({
        user: null,
        profile: null,
        accountType: null,
        isAdmin: false,
        loading: false,
        configured: true,
      });
    }
  }, []);

  useEffect(() => {
    loadSession();
    // If session fetch hangs (e.g. API down), stop loading after 5s so dashboard still renders
    const timeout = setTimeout(() => {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    }, 5000);
    return () => clearTimeout(timeout);
  }, [loadSession]);

  const logout = useCallback(async () => {
    await apiLogout();
    setState({
      user: null,
      profile: null,
      accountType: null,
      isAdmin: false,
      loading: false,
      configured: true,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await loadSession();
  }, [loadSession]);

  return (
    <AuthContext.Provider value={{ ...state, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
