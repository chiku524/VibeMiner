'use client';

import { BRAND_MARK_PNG } from '@/lib/brand';

type BrandMarkProps = {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  title?: string;
};

/** Raster mark from `BRAND_MARK_PNG` (see `scripts/build-brand-assets.cjs`). */
export function BrandMark({ className, 'aria-hidden': ariaHidden = true, title }: BrandMarkProps) {
  const hidden = ariaHidden === true || ariaHidden === 'true';
  const alt = title ?? (hidden ? '' : 'VibeMiner');
  return (
    <img
      src={BRAND_MARK_PNG}
      alt={alt}
      className={['object-contain', className].filter(Boolean).join(' ')}
      aria-hidden={title ? false : hidden}
      decoding="async"
      {...(title ? { title } : {})}
    />
  );
}
