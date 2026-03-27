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

export function sanitizeCommandTemplate(template: string): { valid: boolean; sanitized?: string; error?: string } {
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

const PRESET_ID_REGEX = /^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])?$/;

/** One runnable node mode (e.g. full node vs validator). Same binary; different command / resources. */
export const NetworkNodePresetSchema = z
  .object({
    presetId: z
      .string()
      .min(1)
      .max(48)
      .regex(PRESET_ID_REGEX, 'preset id: lowercase letters, numbers, hyphens only'),
    label: z.string().min(1).max(80),
    description: z.string().max(256).optional(),
    commandTemplate: z
      .string()
      .max(MAX_NODE_STRING_LENGTHS.nodeCommandTemplate)
      .refine((v) => sanitizeCommandTemplate(v).valid, 'Command contains disallowed characters or is invalid'),
    nodeDiskGb: z.number().int().min(1).max(2000).optional(),
    nodeRamMb: z.number().int().min(256).max(65536).optional(),
  })
  .strict();

export type NetworkNodePreset = z.infer<typeof NetworkNodePresetSchema>;

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
export function hasNodeConfig(network: {
  nodeDownloadUrl?: string | null;
  nodeCommandTemplate?: string | null;
  nodePresets?: NetworkNodePreset[] | null;
}): boolean {
  const url = network.nodeDownloadUrl?.trim();
  if (!url) return false;
  if (Array.isArray(network.nodePresets) && network.nodePresets.length > 0) return true;
  return !!network.nodeCommandTemplate?.trim();
}

/**
 * Resolved presets for UI + desktop: explicit `nodePresets` from API, or legacy single command as one preset.
 */
export function resolveNodePresets(network: {
  nodePresets?: NetworkNodePreset[] | null;
  nodeDownloadUrl?: string | null;
  nodeCommandTemplate?: string | null;
  nodeDiskGb?: number | null;
  nodeRamMb?: number | null;
}): NetworkNodePreset[] {
  if (Array.isArray(network.nodePresets) && network.nodePresets.length > 0) {
    return network.nodePresets;
  }
  if (network.nodeDownloadUrl?.trim() && network.nodeCommandTemplate?.trim()) {
    return [
      {
        presetId: 'default',
        label: 'Node',
        commandTemplate: network.nodeCommandTemplate.trim(),
        nodeDiskGb: network.nodeDiskGb ?? undefined,
        nodeRamMb: network.nodeRamMb ?? undefined,
      },
    ];
  }
  return [];
}

/** Normalize node fields after Zod parse: validates URL + commands, returns DB-ready values. */
export function normalizeNodeFieldsForListing(input: {
  nodeDownloadUrl?: string | null;
  nodeCommandTemplate?: string | null;
  nodeDiskGb?: number | null;
  nodeRamMb?: number | null;
  nodeBinarySha256?: string | null;
  nodePresets?: NetworkNodePreset[] | null;
}):
  | {
      ok: true;
      nodeDownloadUrl: string | null;
      nodeCommandTemplate: string | null;
      nodeDiskGb: number | null;
      nodeRamMb: number | null;
      nodeBinarySha256: string | null;
      nodePresetsJson: string | null;
    }
  | { ok: false; error: string } {
  const url = input.nodeDownloadUrl?.trim() ?? '';
  if (!url) {
    return {
      ok: true,
      nodeDownloadUrl: null,
      nodeCommandTemplate: null,
      nodeDiskGb: null,
      nodeRamMb: null,
      nodeBinarySha256: null,
      nodePresetsJson: null,
    };
  }
  if (!isUrlHostAllowed(url)) {
    return { ok: false, error: 'Download URL must be from an allowed host (e.g. GitHub)' };
  }

  const sha = input.nodeBinarySha256?.trim();
  if (sha && !/^[a-fA-F0-9]{64}$/.test(sha)) {
    return { ok: false, error: 'Binary SHA256 must be 64 hex characters' };
  }

  const presets = input.nodePresets;
  if (Array.isArray(presets) && presets.length > 0) {
    const seen = new Set<string>();
    for (const p of presets) {
      if (seen.has(p.presetId)) {
        return { ok: false, error: `Duplicate node preset id: ${p.presetId}` };
      }
      seen.add(p.presetId);
      const sc = sanitizeCommandTemplate(p.commandTemplate);
      if (!sc.valid) {
        return { ok: false, error: sc.error ?? `Invalid command for preset ${p.presetId}` };
      }
    }
    const first = presets[0];
    return {
      ok: true,
      nodeDownloadUrl: url,
      nodeCommandTemplate: first.commandTemplate.trim(),
      nodeDiskGb: first.nodeDiskGb ?? input.nodeDiskGb ?? null,
      nodeRamMb: first.nodeRamMb ?? input.nodeRamMb ?? null,
      nodeBinarySha256: sha ?? null,
      nodePresetsJson: JSON.stringify(presets),
    };
  }

  const tpl = input.nodeCommandTemplate?.trim() ?? '';
  if (!tpl) {
    return { ok: false, error: 'Provide node command template or at least one node preset' };
  }
  const sc = sanitizeCommandTemplate(tpl);
  if (!sc.valid) {
    return { ok: false, error: sc.error ?? 'Invalid node command template' };
  }
  return {
    ok: true,
    nodeDownloadUrl: url,
    nodeCommandTemplate: tpl,
    nodeDiskGb: input.nodeDiskGb ?? null,
    nodeRamMb: input.nodeRamMb ?? null,
    nodeBinarySha256: sha ?? null,
    nodePresetsJson: null,
  };
}

/** Parse `node_presets_json` from D1 into validated presets (empty / invalid → undefined). */
export function parseStoredNodePresetsJson(
  json: string | null | undefined
): NetworkNodePreset[] | undefined {
  if (typeof json !== 'string' || !json.trim()) return undefined;
  try {
    const raw: unknown = JSON.parse(json);
    if (!Array.isArray(raw)) return undefined;
    const out: NetworkNodePreset[] = [];
    for (const item of raw) {
      const r = NetworkNodePresetSchema.safeParse(item);
      if (r.success) out.push(r.data);
    }
    return out.length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}
