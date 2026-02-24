'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // mode="wait": old page exits fully before new page mounts, so we never show an empty frame.
  // Skip initial fade so the incoming page is never painted at opacity 0.
  const skipInitialFade = true;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={skipInitialFade ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
        className="min-h-screen w-full"
      >
        <div className="min-h-screen w-full">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
