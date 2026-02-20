'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Scroll to top on route change so content (e.g. home) is in view when navigating from dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Skip initial fade so the incoming page is never painted at opacity 0.
  const skipInitialFade = true;

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={pathname}
        initial={skipInitialFade ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
