/**
 * VibeMiner platform wallet — public addresses only (listing & withdrawal fees).
 * Do not add seed phrases or private keys here.
 * Override any value with env: NEXT_PUBLIC_PLATFORM_FEE_ETH, etc.
 */

export const PLATFORM_WALLET = {
  /** Primary address for ETH (e.g. listing fee). */
  ETH: process.env.NEXT_PUBLIC_PLATFORM_FEE_ETH ?? '0x961cb0A9a3F58bc08F8cE9fe0F21320e38F516F0',
  SOL: process.env.NEXT_PUBLIC_PLATFORM_FEE_SOL ?? 'CVihJKJNPGpwJzBV7ZGnFUeLaWvKNwMgLAFtH9nffYof',
  /** Extended public key for receiving (display only). */
  DOGE_XPUB:
    process.env.NEXT_PUBLIC_PLATFORM_FEE_DOGE_XPUB ??
    'xpub6CvrLnhcdsHRwyNmxhDYktT1NLaeptkwuL52642DGWZv7HU2mCYLqjXRW6Q1cHvPvW455uuco9Z3hAwjJ86mUtB5PuaAgoF4aQboaecPFwV',
  BTC_XPUB:
    process.env.NEXT_PUBLIC_PLATFORM_FEE_BTC_XPUB ??
    'xpub6C11qDrd2Th2yeaJsJdFwMuamM3ZDFuyAuzLyzyUZVudYq292oF7oTDCtgppsC2VxeiXShgwXDTQkwTv7DPWb8WqmdN4KVTkBtfXNUtqo7W',
  LTC_XPUB:
    process.env.NEXT_PUBLIC_PLATFORM_FEE_LTC_XPUB ??
    'xpub6DNdxPE97aJEDMxC1r9Peu3x8uAQQBc2Cq86ps3E6jztMLAkBw9kuuvpxaS4JkKdk199hqSPpzXzjDKr6H14P4KkkXjSD77CvddQNLBK6Dm',
} as const;
