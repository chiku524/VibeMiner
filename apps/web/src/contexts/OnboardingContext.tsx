'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_KEY = 'vibeminer-onboarding-seen';

type OnboardingState = {
  seen: boolean;
  show: boolean;
  dismiss: () => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [seen, setSeen] = useState(true);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname === '/desktop/splash' || pathname === '/desktop/launch') {
      setShow(false);
      return;
    }
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) {
      setSeen(false);
      setShow(true);
    }
  }, [pathname]);

  const dismiss = useCallback(() => {
    setShow(false);
    setSeen(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, '1');
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (show) {
      document.body.classList.add('onboarding-modal-open');
    } else {
      document.body.classList.remove('onboarding-modal-open');
    }
    return () => document.body.classList.remove('onboarding-modal-open');
  }, [show]);

  const modal = show ? (
    <OnboardingModal onDismiss={dismiss} />
  ) : null;

  return (
    <OnboardingContext.Provider value={{ seen, show, dismiss }}>
      <div className={show ? 'onboarding-page-wrapper' : undefined}>{children}</div>
      {mounted && typeof document !== 'undefined' && createPortal(modal, document.body)}
    </OnboardingContext.Provider>
  );
}

function OnboardingModal({ onDismiss }: { onDismiss: () => void }) {
  return (
    <AnimatePresence>
      <div
        key="onboarding-modal"
        className="fixed inset-0 z-[99999] isolate flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onDismiss}
        style={{ transform: 'translateZ(0)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-900 p-8 shadow-xl"
        >
          <h2 className="font-display text-2xl font-bold text-white">Welcome to VibeMiner</h2>
          <p className="mt-2 text-sm text-gray-400">Here’s how to get started in 3 steps:</p>
          <ol className="mt-6 space-y-4 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-cyan/20 font-mono text-accent-cyan">1</span>
              <div>
                <span className="font-medium text-white">Choose mainnet or devnet</span>
                <p className="mt-0.5 text-gray-400">Mainnet for real rewards; devnet for testing.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-cyan/20 font-mono text-accent-cyan">2</span>
              <div>
                <span className="font-medium text-white">Select a network</span>
                <p className="mt-0.5 text-gray-400">Pick a blockchain that needs hashrate.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-cyan/20 font-mono text-accent-cyan">3</span>
              <div>
                <span className="font-medium text-white">Click start</span>
                <p className="mt-0.5 text-gray-400">No terminal required. One click and you’re mining.</p>
              </div>
            </li>
          </ol>
          <button
            onClick={onDismiss}
            className="mt-8 w-full rounded-xl bg-accent-cyan py-2.5 font-medium text-surface-950 transition hover:brightness-110"
          >
            Get started
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  return ctx ?? { seen: true, show: false, dismiss: () => {} };
}
