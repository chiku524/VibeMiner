'use client';

/** Lightweight SVG sparkline for a series of numbers. No external deps. */
export function Sparkline({
  data,
  width = 80,
  height = 28,
  stroke = 'currentColor',
  strokeWidth = 1.5,
  className = '',
  ariaHidden = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  ariaHidden?: boolean;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const stepX = w / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      width={width}
      height={height}
      className={className}
      aria-hidden={ariaHidden}
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
