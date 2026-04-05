'use client';

import type { ImgHTMLAttributes } from 'react';
import { BRAND_MARK_PNG } from '@/lib/brand';
import { site } from '@/lib/site';

type BrandMarkProps = {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  title?: string;
  /** Hint the browser to fetch the mark early (e.g. desktop splash). */
  fetchPriority?: 'high' | 'low' | 'auto';
};

/** Raster mark from `BRAND_MARK_PNG` (see `scripts/build-brand-assets.cjs`). */
export function BrandMark({
  className,
  'aria-hidden': ariaHidden = true,
  title,
  fetchPriority,
}: BrandMarkProps) {
  const hidden = ariaHidden === true || ariaHidden === 'true';
  const alt = title ?? (hidden ? '' : site.brandMarkImageAlt);
  return (
    <img
      src={BRAND_MARK_PNG}
      alt={alt}
      className={['object-contain', className].filter(Boolean).join(' ')}
      aria-hidden={title ? false : hidden}
      decoding="async"
      {...(fetchPriority ? ({ fetchPriority } as ImgHTMLAttributes<HTMLImageElement>) : {})}
      {...(title ? { title } : {})}
    />
  );
}
