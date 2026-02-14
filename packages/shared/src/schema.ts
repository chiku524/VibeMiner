import { z } from 'zod';

/**
 * Runtime schema for blockchain network integration.
 * Any new network (mainnet or devnet) must pass this validation to prevent UI/API malfunctions.
 */
const NETWORK_ID_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const MAX_STRING_LENGTHS = {
  id: 64,
  name: 128,
  symbol: 16,
  description: 512,
  icon: 500,
  algorithm: 64,
  poolUrl: 256,
  website: 256,
  rewardRate: 128,
  minPayout: 64,
  requestedBy: 128,
} as const;

export const NetworkEnvironmentSchema = z.enum(['mainnet', 'devnet']);
export type NetworkEnvironment = z.infer<typeof NetworkEnvironmentSchema>;

export const NetworkStatusSchema = z.enum(['live', 'coming-soon', 'requested']);
export type NetworkStatus = z.infer<typeof NetworkStatusSchema>;

export const BlockchainNetworkSchema = z.object({
  id: z
    .string()
    .min(1, 'id is required')
    .max(MAX_STRING_LENGTHS.id)
    .regex(NETWORK_ID_REGEX, 'id must be lowercase alphanumeric and hyphens only'),
  name: z.string().min(1, 'name is required').max(MAX_STRING_LENGTHS.name),
  symbol: z.string().min(1, 'symbol is required').max(MAX_STRING_LENGTHS.symbol),
  description: z.string().min(1, 'description is required').max(MAX_STRING_LENGTHS.description),
  icon: z.string().min(1, 'icon is required').max(MAX_STRING_LENGTHS.icon),
  algorithm: z.string().min(1, 'algorithm is required').max(MAX_STRING_LENGTHS.algorithm),
  environment: NetworkEnvironmentSchema,
  status: NetworkStatusSchema,
  poolUrl: z
    .string()
    .max(MAX_STRING_LENGTHS.poolUrl)
    .refine(
      (v) => (v.includes('://') ? z.string().url().safeParse(v).success : /^[a-z0-9.-]+$/i.test(v)),
      'poolUrl must be a valid URL or hostname'
    )
    .optional(),
  poolPort: z.number().int().min(1).max(65535).optional(),
  website: z.string().url().max(MAX_STRING_LENGTHS.website).optional(),
  rewardRate: z.string().max(MAX_STRING_LENGTHS.rewardRate).optional(),
  minPayout: z.string().max(MAX_STRING_LENGTHS.minPayout).optional(),
  requestedBy: z.string().max(MAX_STRING_LENGTHS.requestedBy).optional(),
});

export type BlockchainNetworkInput = z.input<typeof BlockchainNetworkSchema>;
export type BlockchainNetworkValidated = z.infer<typeof BlockchainNetworkSchema>;

/** Validates a single network. Returns { success: true, data } or { success: false, error }. */
export function parseNetwork(
  raw: unknown
): { success: true; data: BlockchainNetworkValidated } | { success: false; error: z.ZodError } {
  const result = BlockchainNetworkSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}

/** Validates an array of networks. Returns only valid entries; invalid ones are skipped and reported. */
export function parseNetworkList(
  raw: unknown
): { valid: BlockchainNetworkValidated[]; errors: { index: number; error: z.ZodError }[] } {
  const arr = Array.isArray(raw) ? raw : [];
  const valid: BlockchainNetworkValidated[] = [];
  const errors: { index: number; error: z.ZodError }[] = [];
  arr.forEach((item, index) => {
    const result = BlockchainNetworkSchema.safeParse(item);
    if (result.success) valid.push(result.data);
    else errors.push({ index, error: result.error });
  });
  return { valid, errors };
}
