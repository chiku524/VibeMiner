import { fetchBoingOfficialNetworks, type BoingOfficialNetworksBundle } from '@vibeminer/shared';

const BOING_OFFICIAL_CACHE_MS = 5 * 60 * 1000;

let cache: { at: number; bundle: BoingOfficialNetworksBundle | null } | null = null;

/**
 * Cached `GET https://boing.network/api/networks` parse (~5 min per server instance).
 */
export async function getBoingOfficialBundleCached(): Promise<BoingOfficialNetworksBundle | null> {
  const now = Date.now();
  if (cache && now - cache.at < BOING_OFFICIAL_CACHE_MS) {
    return cache.bundle;
  }
  const bundle = await fetchBoingOfficialNetworks({ timeoutMs: 6000 });
  cache = { at: now, bundle };
  return bundle;
}
