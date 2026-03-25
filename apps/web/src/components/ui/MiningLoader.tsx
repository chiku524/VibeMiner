'use client';

import { useId, useMemo } from 'react';
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
  /**
   * When set (0–100), draws a determinate ring around the scene.
   * When omitted, the ring shows an indeterminate sweep.
   */
  progress?: number;
};

/**
 * Loading indicator: animated pickaxe striking a pile of coins; optional progress ring.
 */
export function MiningLoader({
  size = 'md',
  className,
  label,
  labelClassName,
  progress,
}: MiningLoaderProps) {
  const raw = useId().replace(/:/g, '');
  const p = `vm-ml-${raw}`;
  const dim = SIZES[size];
  const reduced = useReducedMotion() ?? false;

  const cycleDurationSec = 1.2;
  const swingTimes = [0, 0.3, 0.42, 1] as const;
  const swingEase = [0.42, 0, 0.58, 1] as const;

  const swingTransition = reduced
    ? { duration: 0 }
    : {
        repeat: Infinity,
        duration: cycleDurationSec,
        ease: swingEase,
        times: [...swingTimes],
      };

  /** Degrees — rest back, strike forward, small follow-through, rest */
  const pickaxeRotate = reduced ? -34 : [-38, 14, 2, -38];

  const coinsTransition = reduced
    ? { duration: 0 }
    : {
        repeat: Infinity,
        duration: cycleDurationSec,
        ease: swingEase,
        times: [...swingTimes],
      };

  const coinsY = reduced ? 0 : [0, -5, -1.5, 0];
  const coinsScale = reduced ? 1 : [1, 1.06, 1.02, 1];

  const sparksOpacity = reduced ? 0 : [0, 0.95, 0, 0];
  const sparksTransition = reduced ? { duration: 0 } : { repeat: Infinity, duration: cycleDurationSec, times: [...swingTimes] };

  const progressClamped = useMemo(() => {
    if (progress === undefined || Number.isNaN(progress)) return undefined;
    return Math.min(100, Math.max(0, progress));
  }, [progress]);

  const ringDashOffset = progressClamped !== undefined ? 100 - progressClamped : undefined;

  return (
    <div
      className={['inline-flex flex-col items-center justify-center', className].filter(Boolean).join(' ')}
      role={progressClamped !== undefined ? 'progressbar' : 'status'}
      aria-live="polite"
      aria-busy={progressClamped === undefined ? true : undefined}
      aria-valuemin={progressClamped !== undefined ? 0 : undefined}
      aria-valuemax={progressClamped !== undefined ? 100 : undefined}
      aria-valuenow={progressClamped}
    >
      <span className="sr-only">
        {progressClamped !== undefined ? `Loading ${Math.round(progressClamped)} percent` : 'Loading'}
      </span>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible text-teal-200/90"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${p}-wood`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3f2e22" />
              <stop offset="50%" stopColor="#7c4a2d" />
              <stop offset="100%" stopColor="#4a3020" />
            </linearGradient>
            <linearGradient id={`${p}-steel`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="45%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <radialGradient id={`${p}-btc`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="55%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>
            <radialGradient id={`${p}-eth`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#312e81" />
            </radialGradient>
            <radialGradient id={`${p}-coin`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>
            <radialGradient id={`${p}-xmr`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>
            <filter id={`${p}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Progress / indeterminate ring */}
          <circle
            cx="24"
            cy="24"
            r="21.5"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth="1.75"
            pathLength={100}
            transform="rotate(-90 24 24)"
          />
          {progressClamped !== undefined ? (
            <circle
              cx="24"
              cy="24"
              r="21.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="100"
              strokeDashoffset={ringDashOffset}
              transform="rotate(-90 24 24)"
              filter={`url(#${p}-glow)`}
            />
          ) : (
            <motion.circle
              cx="24"
              cy="24"
              r="21.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="20 80"
              transform="rotate(-90 24 24)"
              filter={`url(#${p}-glow)`}
              animate={reduced ? { strokeDashoffset: 0 } : { strokeDashoffset: [0, -100] }}
              transition={
                reduced ? { duration: 0 } : { repeat: Infinity, duration: cycleDurationSec, ease: 'linear' }
              }
            />
          )}

          {/* Scene: translate into inner frame */}
          <g transform="translate(2.5 2) scale(0.92)">
            {/* Ground */}
            <ellipse cx="28" cy="40" rx="18" ry="2.2" fill="#0f172a" opacity="0.55" />

            {/* Coin pile (behind pickaxe head at strike) */}
            <motion.g
              style={{ transformOrigin: '28px 36px' }}
              animate={{ y: coinsY, scale: coinsScale }}
              transition={coinsTransition}
            >
              <circle cx="33" cy="34" r="5.2" fill={`url(#${p}-btc)`} stroke="#7c2d12" strokeWidth="0.35" />
              <text
                x="33"
                y="35.5"
                textAnchor="middle"
                fill="white"
                fillOpacity={0.92}
                fontSize="5.5"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                ₿
              </text>
              <circle cx="26.5" cy="35.5" r="4.4" fill={`url(#${p}-eth)`} stroke="#312e81" strokeWidth="0.3" />
              <text
                x="26.5"
                y="36.8"
                textAnchor="middle"
                fill="white"
                fillOpacity={0.9}
                fontSize="4.5"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                Ξ
              </text>
              <circle cx="30" cy="37.8" r="3.5" fill={`url(#${p}-coin)`} stroke="#713f12" strokeWidth="0.28" />
              <circle cx="36.2" cy="36.8" r="3.2" fill={`url(#${p}-xmr)`} stroke="#7c2d12" strokeWidth="0.28" />
              <text
                x="36.2"
                y="38"
                textAnchor="middle"
                fill="white"
                fillOpacity={0.85}
                fontSize="3.8"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                ◈
              </text>
            </motion.g>

            {/* Impact sparks */}
            <motion.g
              fill="none"
              stroke="#fde68a"
              strokeWidth="0.65"
              strokeLinecap="round"
              animate={{ opacity: sparksOpacity }}
              transition={sparksTransition}
            >
              <path d="M38 28l3-2.5M41 30l2.8-1.2M37 31l3.5 0.5" />
            </motion.g>

            {/* Pickaxe: pivot at handle base (11.5, 40.5) in this inner coord space */}
            <g transform="translate(11.5 40.5)">
              <motion.g animate={{ rotate: pickaxeRotate }} transition={swingTransition}>
                <g transform="translate(-11.5 -40.5)">
                  <path
                    d="M9 40.5 L13 40.5 L14 18 L10 18 Z"
                    fill={`url(#${p}-wood)`}
                    stroke="#1a0f0a"
                    strokeWidth="0.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 18 L22 12 L26 22 L17 24 Z"
                    fill={`url(#${p}-steel)`}
                    stroke="#0f172a"
                    strokeWidth="0.2"
                    strokeLinejoin="round"
                  />
                  <path d="M22 12 L28 9 L26 16 Z" fill="#cbd5e1" stroke="#0f172a" strokeWidth="0.15" />
                </g>
              </motion.g>
            </g>
          </g>
        </svg>
      </div>
      {label ? (
        <p className={['mt-3 text-sm text-gray-400', labelClassName].filter(Boolean).join(' ')}>{label}</p>
      ) : null}
    </div>
  );
}
