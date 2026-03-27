import { isUploadedNetworkIconPath } from '@vibeminer/shared';

/** R2 object key for a stored listing logo, or null if not an uploaded icon path. */
export function r2KeyFromUploadedIconPath(icon: string | null | undefined): string | null {
  if (!icon || typeof icon !== 'string') return null;
  const t = icon.trim();
  if (!isUploadedNetworkIconPath(t)) return null;
  const file = t.replace(/^\/api\/network-icons\//i, '');
  if (!/^[a-f0-9]{32}\.(png|jpe?g|webp)$/i.test(file)) return null;
  return `network-icons/${file}`;
}

export async function deleteNetworkIconFromR2(
  bucket: R2Bucket,
  icon: string | null | undefined
): Promise<void> {
  const key = r2KeyFromUploadedIconPath(icon);
  if (!key) return;
  try {
    await bucket.delete(key);
  } catch {
    // ignore missing / transient errors
  }
}
