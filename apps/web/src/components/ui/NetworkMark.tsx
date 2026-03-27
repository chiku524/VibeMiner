'use client';

/**
 * Renders a network logo: uploaded image (path or absolute URL) or legacy emoji/text.
 */
export function isNetworkIconImageUrl(icon: string): boolean {
  const t = icon.trim();
  return t.startsWith('/api/network-icons/') || /^https?:\/\//i.test(t);
}

type NetworkMarkProps = {
  icon: string;
  /** For image alt text and a11y */
  label: string;
  /** Outer box: use with fixed square, e.g. h-10 w-10 */
  className?: string;
  /** Extra classes on the emoji/text span */
  textClassName?: string;
};

export function NetworkMark({ icon, label, className = '', textClassName = '' }: NetworkMarkProps) {
  const t = icon.trim() || '⛓';
  if (isNetworkIconImageUrl(t)) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5 ${className}`}
      >
        <img src={t} alt={label} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className} ${textClassName}`} aria-hidden>
      {t}
    </span>
  );
}
