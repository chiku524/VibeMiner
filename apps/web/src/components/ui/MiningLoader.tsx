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
   * When set (0–100), draws a determinate ring around the mark.
   * When omitted, the ring shows an indeterminate sweep (loading without a known percent).
   */
  progress?: number;
};

/**
 * Loading indicator: scythe pivots at grip toward the hex gem; optional progress ring.
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

  /** One shared cycle so scythe, gem, and ring stay in phase */
  const cycleDurationSec = 1;
  const syncTimes = [0, 0.34, 0.42, 0.52, 1] as const;
  const syncEase = [0.38, 0.02, 0.58, 1] as const;

  const syncTransition = reduced
    ? { duration: 0 }
    : {
        repeat: Infinity,
        duration: cycleDurationSec,
        ease: syncEase,
        times: [...syncTimes],
      };

  /** Pivot at grip (18.35, 24.62): scythe arcs toward gem */
  const pickaxeRotate = reduced ? 0 : [-24, 8, 2, -3, -24];

  /** Pulse peaks when the blade is nearest the gem (same keyframe times as scythe) */
  const gemScale = reduced ? 1 : [1, 1.02, 1.08, 1.03, 1];

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
          <linearGradient id={`${p}-gem-main`} x1="25%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="32%" stopColor="#38bdf8" />
            <stop offset="58%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id={`${p}-gem-shade`} x1="0%" y1="40%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#164e63" />
            <stop offset="50%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id={`${p}-gem-edge`} x1="45%" y1="0%" x2="55%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id={`${p}-base`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5c5348" />
            <stop offset="100%" stopColor="#0c0a08" />
          </linearGradient>
          <linearGradient id={`${p}-base-cap`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4bc94" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
          <linearGradient id={`${p}-base-mid`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a4238" />
            <stop offset="100%" stopColor="#1a1612" />
          </linearGradient>
          <linearGradient id={`${p}-handle`} gradientUnits="userSpaceOnUse" x1="18.35" y1="24.62" x2="20.98" y2="15.08">
            <stop offset="0%" stopColor="#1a100c" />
            <stop offset="45%" stopColor="#8b5a3c" />
            <stop offset="100%" stopColor="#3d2818" />
          </linearGradient>
          <linearGradient id={`${p}-steel`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="35%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id={`${p}-eye-rim`} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id={`${p}-wood-socket`} x1="40%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="#e8dcc8" />
            <stop offset="55%" stopColor="#78716c" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>
        </defs>
        <circle
          cx="24"
          cy="24"
          r="20.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.24}
          strokeWidth="2.25"
          pathLength={100}
          transform="rotate(-90 24 24)"
        />
        {progressClamped !== undefined ? (
          <circle
            cx="24"
            cy="24"
            r="20.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={ringDashOffset}
            transform="rotate(-90 24 24)"
          />
        ) : (
          <motion.circle
            cx="24"
            cy="24"
            r="20.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="22 78"
            transform="rotate(-90 24 24)"
            animate={reduced ? { strokeDashoffset: 0 } : { strokeDashoffset: [0, -100] }}
            transition={
              reduced ? { duration: 0 } : { repeat: Infinity, duration: cycleDurationSec, ease: 'linear' }
            }
          />
        )}
        <g transform="translate(2.5, 6.5) scale(1.36)">
          <path d="M3.85 27.35h14.5v2.25H3.85z" fill={`url(#${p}-base-mid)`} stroke="#2a2520" strokeWidth="0.22" />
          <path d="M4 26.35h13.35v2.35H4z" fill={`url(#${p}-base)`} stroke="#3d3530" strokeWidth="0.24" />
          <path d="M4 26.35l0.5-0.42h12.35l0.5 0.42z" fill={`url(#${p}-base-cap)`} opacity={0.92} />
          <path d="M7.15 28.05h7.05" stroke="#c4a574" strokeWidth="0.38" strokeLinecap="round" opacity={0.35} />
          <motion.g
            animate={{ scale: gemScale }}
            transition={syncTransition}
          >
            <path
              d="M9.5 5.45L12.95 7.45L12.95 11.45L9.5 13.45L6.05 11.45L6.05 7.45L9.5 5.45Z"
              fill={`url(#${p}-gem-main)`}
              stroke={`url(#${p}-gem-edge)`}
              strokeWidth="0.42"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 5.45V13.45M6.05 9.45h6.9M7.35 7.1l4.3 4.7M7.35 11.8l4.3-4.7"
              stroke={`url(#${p}-gem-shade)`}
              strokeWidth="0.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55}
            />
            <path d="M9.5 5.45L7.95 7.45L9.5 8.55L11.05 7.45L9.5 5.45Z" fill="#ecfeff" opacity={0.38} />
          </motion.g>
          <motion.g
            animate={{ rotate: reduced ? -24 : pickaxeRotate }}
            transition={syncTransition}
            style={{ transformOrigin: '18.35px 24.62px', transformBox: 'view-box' as const }}
          >
            <path d="M18.42 24.72L20.98 15.08" stroke="#1a0f0a" strokeWidth="0.64" strokeLinecap="round" opacity={0.45} fill="none" />
            <ellipse
              cx="17.98"
              cy="24.76"
              rx="0.37"
              ry="0.23"
              fill={`url(#${p}-handle)`}
              stroke="#0a0a0a"
              strokeWidth="0.1"
              transform="rotate(-8 17.98 24.76)"
            />
            <path d="M18.35 24.62L20.98 15.08" stroke="#0a0a0a" strokeWidth="1.54" strokeLinecap="round" fill="none" />
            <path d="M18.35 24.62L20.98 15.08" stroke={`url(#${p}-handle)`} strokeWidth="1.22" strokeLinecap="round" fill="none" />
            <path
              d="M18.78 22.48L18.98 19.05L19.15 16.65"
              stroke="#3d2818"
              strokeWidth="0.07"
              strokeLinecap="round"
              opacity={0.55}
              fill="none"
            />
            <path d="M18.58 20.95L18.75 17.45" stroke="#3d2818" strokeWidth="0.06" strokeLinecap="round" opacity={0.45} fill="none" />
            <path d="M18.48 24.28L20.38 15.22" stroke="#c9a66c" strokeWidth="0.12" strokeLinecap="round" opacity={0.38} fill="none" />
            <path
              fill={`url(#${p}-steel)`}
              stroke="#020617"
              strokeWidth="0.12"
              strokeLinejoin="round"
              d="M10.42 8.38C13.55 11.22 16.88 13.38 19.48 14.62C20.22 15.02 20.9 15.26 21.58 15.42C21.88 14.48 22.15 13.52 22.35 12.58C23.72 8.68 25.88 5.18 28.08 2.72C28.48 2.28 28.42 1.68 27.88 1.35C25.32 0.82 22.48 1.95 19.62 3.88C15.82 6.38 12.58 7.96 10.42 8.38Z"
            />
            <path
              d="M11.15 8.85Q15.85 12.35 20.05 14.75"
              stroke="#f8fafc"
              strokeWidth="0.1"
              strokeLinecap="round"
              opacity={0.5}
              fill="none"
            />
            <path d="M13.85 6.35Q20.5 3.35 24.85 2.55Q26.95 2.15 28.25 2.65" stroke="#cbd5e1" strokeWidth="0.08" strokeLinecap="round" opacity={0.44} fill="none" />
            <path
              d="M10.55 8.45L10.75 8.62M26.95 1.55L27.15 1.78"
              stroke="#f1f5f9"
              strokeWidth="0.06"
              strokeLinecap="round"
              opacity={0.52}
              fill="none"
            />
            <path d="M20.15 15.05Q21.25 13.75 22.15 15.1" stroke="#475569" strokeWidth="0.07" strokeLinecap="round" opacity={0.72} fill="none" />
            <ellipse
              cx="20.72"
              cy="15.02"
              rx="0.48"
              ry="0.22"
              fill={`url(#${p}-wood-socket)`}
              stroke="#0a0a0a"
              strokeWidth="0.06"
              transform="rotate(-26 20.72 15.02)"
            />
            <ellipse
              cx="20.72"
              cy="15.02"
              rx="0.58"
              ry="0.28"
              fill="none"
              stroke={`url(#${p}-eye-rim)`}
              strokeWidth="0.07"
              transform="rotate(-26 20.72 15.02)"
            />
          </motion.g>
        </g>
      </svg>
      {label ? (
        <p className={['mt-3 text-sm text-gray-400', labelClassName].filter(Boolean).join(' ')}>{label}</p>
      ) : null}
    </div>
  );
}
