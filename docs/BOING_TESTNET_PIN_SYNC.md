# Keeping the Boing testnet node zip pin current

VibeMiner’s offline defaults and URL rewrite logic use **`BOING_TESTNET_DEFAULT_DOWNLOAD_TAG`** and per-zip **`BOING_TESTNET_ZIP_SHA256_*`** in **`packages/shared/src/boing-testnet-node.ts`**. Live installs also merge **`GET https://boing.network/api/networks`** (see **`boing-official-api.ts`**), which must stay aligned — **`website/functions/api/networks.js`** in the Boing monorepo.

## After a new `testnet-v0.1.x` release on GitHub

1. Wait for the Boing **`Release binaries`** workflow to finish and attach **`release-{windows,linux,macos}-*.zip`** (non-draft for `testnet*` tags).
2. From the VibeMiner repo root, print digests (requires Node 18+ for global `fetch`):

   ```bash
   node scripts/print-boing-testnet-zip-shas.mjs testnet-v0.1.x
   ```

3. Update **`boing-testnet-node.ts`**: tag constant, three SHA256 lines, and extend **`STALE_TESTNET_TAG_RE`** if you still want older URLs rewritten to the new tag.
4. Update **`boing.network`** **`website/functions/api/networks.js`**: **`BOING_TESTNET_DOWNLOAD_TAG`**, **`BOING_ZIP_SHA`**, same **`STALE_TESTNET_TAG_RE`** rule.
5. Apply D1 migrations on **vibeminer-db** and **boing-network-db** (see **`apps/web/d1/migrations/009_boing_testnet_zip_urls_v0_1_9.sql`** pattern) or regenerate via Boing **`website/scripts/network-listings-release-sql.mjs`**.
6. Deploy **boing.network** so **`/api/networks`** exposes the new **`meta.boing_testnet_download_tag`**.
7. Bump the **VibeMiner desktop** version and push a **`v*`** tag if you are shipping a new desktop build.

## Automation options

| Approach | What it does |
|----------|----------------|
| **This repo — scheduled workflow** | **`.github/workflows/boing-testnet-pin-check.yml`** runs weekly and on **`workflow_dispatch`**. It fails if GitHub’s latest **`testnet-v0.1.*`** tag is newer than the constant in **`boing-testnet-node.ts`** (reminder to open a bump PR; it does not auto-edit files). |
| **`repository_dispatch` from Boing** | In **Boing-Network/boing.network** `release.yml`, a follow-up job could call **`repository_dispatch`** on VibeMiner with the new tag. Requires a PAT with **`repo`** scope stored as **`VIBEMINER_DISPATCH_TOKEN`** (or similar) in the Boing repo — not configured by default. |
| **Dependabot / Renovate** | Not applicable to arbitrary GitHub release assets; use the check workflow or dispatch instead. |

For full ordering (tag → CI → D1 → Pages → VibeMiner), see Boing **[TESTNET-NODE-RELEASE-CHECKLIST.md](https://github.com/Boing-Network/boing.network/blob/main/docs/TESTNET-NODE-RELEASE-CHECKLIST.md)** and **[VIBEMINER-INTEGRATION.md](https://github.com/Boing-Network/boing.network/blob/main/docs/VIBEMINER-INTEGRATION.md)** §6.
