'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const SIZES = {
  xs: 16,
  sm: 24,
  md: 40,
  lg: 56,
} as const;

export type MiningLoaderSize = keyof typeof SIZES;

type MiningLoaderProps = {
  size?: MiningLoaderSize;
  className?: string;
  /** Shown below the animation */
  label?: string;
  labelClassName?: string;
};

/**
 * Loading indicator: pickaxe strikes a coin ($) with a subtle chain hint — mining + value.
 */
export function MiningLoader({ size = 'md', className, label, labelClassName }: MiningLoaderProps) {
  const raw = useId().replace(/:/g, '');
  const gid = `vm-ml-${raw}`;
  const dim = SIZES[size];
  const reduced = useReducedMotion() ?? false;

  const pickaxeTransition = reduced
    ? { duration: 0 }
    : { repeat: Infinity, duration: 0.88, ease: [0.45, 0, 0.55, 1] as const };

  const pickaxeRotate = reduced ? 0 : [-48, -10, -16, -48];

  const coinScale = reduced ? 1 : [1, 1, 1.06, 1, 1];
  const coinTimes = [0, 0.32, 0.38, 0.48, 1];

  return (
    <div
      className={['inline-flex flex-col items-center justify-center', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <rect x="6" y="38" width="6" height="6" rx="1.2" stroke={`url(#${gid})`} strokeWidth="1.2" fill="none" opacity={0.45} />
        <rect x="15" y="38" width="6" height="6" rx="1.2" stroke={`url(#${gid})`} strokeWidth="1.2" fill="none" opacity={0.3} />
        <path d="M12 41h3" stroke={`url(#${gid})`} strokeWidth="0.9" strokeLinecap="round" opacity={0.5} />
        <motion.g
          animate={{ scale: coinScale }}
          transition={
            reduced
              ? { duration: 0 }
              : { repeat: Infinity, duration: 0.88, times: coinTimes, ease: 'easeInOut' }
          }
        >
          <circle cx="30" cy="22" r="11" fill="#0c0e12" stroke={`url(#${gid})`} strokeWidth="2" />
          <path
            d="M30 13v18M26 14.5h5.2a2.4 2.4 0 0 1 0 4.8H26M26 25.7h5.6a2.4 2.4 0 0 1 0 4.8H26"
            stroke={`url(#${gid})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>
        <motion.g
          animate={{ rotate: reduced ? -28 : pickaxeRotate }}
          transition={pickaxeTransition}
          style={{ transformOrigin: '9px 9px', transformBox: 'fill-box' }}
        >
          <line
            x1="8"
            y1="8"
            x2="26"
            y2="26"
            stroke={`url(#${gid})`}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M26 26l6.5-4-2.2 7.2z"
            fill={`url(#${gid})`}
            stroke={`url(#${gid})`}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </motion.g>
      </svg>
      {label ? (
        <p className={['mt-3 text-sm text-gray-400', labelClassName].filter(Boolean).join(' ')}>{label}</p>
      ) : null}
    </div>
  );
}
