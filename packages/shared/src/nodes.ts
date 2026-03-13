/**
 * Node-running support: schema, validation, resource tiers, and security checks.
 * Networks can provide node download URL + command template via registration.
 * VibeMiner validates configs (URL allowlist, command sanitization) before accepting.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Resource tiers (for UI categorization: Light / Standard / Heavy)
// ---------------------------------------------------------------------------

export type ResourceTier = 'light' | 'standard' | 'heavy';

export const RESOURCE_TIER_BOUNDS = {
  light: { diskGbMax: 10, ramMbMax: 2048 },
  standard: { diskGbMax: 100, ramMbMax: 8192 },
  heavy: { diskGbMax: Infinity, ramMbMax: Infinity },
} as const;

/** Infer resource tier from disk (GB) and RAM (MB). */
export function getResourceTier(
  diskGb?: number | null,
  ramMb?: number | null
): ResourceTier {
  const disk = diskGb ?? 0;
  const ram = ramMb ?? 0;
  if (disk <= RESOURCE_TIER_BOUNDS.light.diskGbMax && ram <= RESOURCE_TIER_BOUNDS.light.ramMbMax) {
    return 'light';
  }
  if (disk <= RESOURCE_TIER_BOUNDS.standard.diskGbMax && ram <= RESOURCE_TIER_BOUNDS.standard.ramMbMax) {
    return 'standard';
  }
  return 'heavy';
}

export const RESOURCE_TIER_LABELS: Record<ResourceTier, string> = {
  light: 'Light',
  standard: 'Standard',
  heavy: 'Heavy',
};

export const RESOURCE_TIER_DESCRIPTIONS: Record<ResourceTier, string> = {
  light: '< 10 GB disk, < 2 GB RAM',
  standard: '10–100 GB disk, up to 8 GB RAM',
  heavy: '100+ GB disk',
};

// ---------------------------------------------------------------------------
// Node config schema (optional fields for networks that support running nodes)
// ---------------------------------------------------------------------------

const MAX_NODE_STRING_LENGTHS = {
  nodeDownloadUrl: 512,
  nodeCommandTemplate: 1024,
  nodeBinarySha256: 64,
} as const;

/** Allowed URL hostnames for node downloads (security: no arbitrary URLs). */
export const NODE_DOWNLOAD_ALLOWED_HOSTS = [
  'github.com',
  'github.githubassets.com',
  'objects.githubusercontent.com',
  'releases.githubusercontent.com',
  'getmonero.org',
  'downloads.getmonero.org',
  'kaspa.org',
  'ergoplatform.org',
  'raptoreum.com',
  'raw.githubusercontent.com',
  'api.github.com',
] as const;

function isUrlHostAllowed(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return NODE_DOWNLOAD_ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

/** Command template placeholders we allow (desktop node-service substitutes these). No shell metacharacters. */
const ALLOWED_PLACEHOLDERS = ['{dataDir}', '{dataDirPath}', '{data_dir}', '{data_dir_path}'];

function sanitizeCommandTemplate(template: string): { valid: boolean; sanitized?: string; error?: string } {
  // Reject shell metacharacters
  if (/[;&|$`<>()]/.test(template)) {
    return { valid: false, error: 'Command contains disallowed characters (;&|$`<>()' };
  }
  // Reject newlines
  if (/\n|\r/.test(template)) {
    return { valid: false, error: 'Command must not contain newlines' };
  }
  const sanitized = template.trim();
  if (sanitized.length < 5) {
    return { valid: false, error: 'Command template too short' };
  }
  if (sanitized.length > MAX_NODE_STRING_LENGTHS.nodeCommandTemplate) {
    return { valid: false, error: 'Command template too long' };
  }
  return { valid: true, sanitized };
}

export const NodeConfigSchema = z
  .object({
    nodeDownloadUrl: z
      .string()
      .url('Must be a valid HTTPS URL')
      .max(MAX_NODE_STRING_LENGTHS.nodeDownloadUrl)
      .refine(isUrlHostAllowed, 'Download URL must be from an allowed host (e.g. GitHub, official project)'),
    nodeCommandTemplate: z
      .string()
      .max(MAX_NODE_STRING_LENGTHS.nodeCommandTemplate)
      .refine((v) => {
        const r = sanitizeCommandTemplate(v);
        return r.valid;
      }, 'Command contains disallowed characters or is invalid'),
    nodeDiskGb: z.number().int().min(1).max(2000).optional(),
    nodeRamMb: z.number().int().min(256).max(65536).optional(),
    nodeBinarySha256: z
      .string()
      .regex(/^[a-fA-F0-9]{64}$/, 'Must be 64 hex chars (SHA256)')
      .optional(),
  })
  .strict();

export type NodeConfig = z.infer<typeof NodeConfigSchema>;

/** Validate node config for registration. Acts as "malware detector": URL allowlist, command sanitization, optional hash. */
export function validateNodeConfig(
  raw: unknown
): { success: true; data: NodeConfig } | { success: false; error: string } {
  const parsed = NodeConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first?.message ?? 'Invalid node config' };
  }
  return { success: true, data: parsed.data };
}

/** Check if a network has runnable node config. */
export function hasNodeConfig(network: { nodeDownloadUrl?: string | null; nodeCommandTemplate?: string | null }): boolean {
  return !!(network.nodeDownloadUrl?.trim() && network.nodeCommandTemplate?.trim());
}
