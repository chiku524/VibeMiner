# Node Running

VibeMiner lets users run full blockchain nodes via the UI instead of the terminal. Networks can provide node download URL and command template through the **Request listing** form.

## Security (Malware-Detector Style)

Before accepting node config from registration, we run validation that acts like a malware detector:

1. **URL allowlist** — Download URLs must be from allowed hosts:
   - github.com, releases.githubusercontent.com
   - getmonero.org, kaspa.org, ergoplatform.org, raptoreum.com
   - Add new hosts in `packages/shared/src/nodes.ts` → `NODE_DOWNLOAD_ALLOWED_HOSTS`

2. **Command sanitization** — Rejects:
   - Shell metacharacters: `;&|$`\`<>()`
   - Newlines
   - Overlong strings

3. **Optional SHA256** — Networks can provide the expected SHA256 of the node binary. We verify after download and abort if it doesn’t match.

4. **Transparency** — Users see resource requirements (disk, RAM) and can inspect what will run before starting.

## Resource Tiers

Networks are categorized by disk/RAM:

| Tier      | Disk        | RAM         |
|----------|-------------|-------------|
| Light    | < 10 GB     | < 2 GB      |
| Standard | 10–100 GB   | up to 8 GB  |
| Heavy    | 100+ GB     | —           |

The dashboard and network modal show these tiers so users can choose suitable networks.

## Network Registration

When requesting a listing, networks can optionally add **Node support**:

- **Network logo** — Upload PNG, JPEG, or WebP (max 512 KB) on the listing form, stored in R2 and served at `/api/network-icons/…`, or use a short emoji as before. Replacing the logo on save removes the previous file from R2; deleting the listing removes its logo too.
- **Node download URL** — HTTPS URL to the node binary/archive
- **Command template** — Use `{dataDir}` for the data directory path
- **Disk (GB)** / **RAM (MB)** — Resource requirements
- **Binary SHA256** — Optional integrity check

## Boing node version vs JSON-RPC

VibeMiner runs the **downloaded** `boing-node` binary; it does not proxy or filter RPC methods. Features such as read-only **`boing_getQaRegistry`** (used by [boing.observer/qa](https://boing.observer/qa) for QA transparency) appear only if that binary was built from a Boing release that includes the method. If tools report **Method not found**, publish a newer `boing-node` zip, update the network’s **node download URL** (and tag defaults in the repo if you maintain them), and have users restart the node so a fresh binary is used.

See **[BOING_QA_RPC_AND_RELEASES.md](./BOING_QA_RPC_AND_RELEASES.md)** for a full maintainer checklist.

## Database

Run the migration for existing D1 databases:

```bash
cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/001_add_node_columns.sql
```

**Multiple node modes** (`node_presets_json`):

- **Idempotent (recommended):** skips if the column already exists.

```bash
npm run db:ensure-node-presets-json -w vibeminer-web
```

- **Raw SQL:** `wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/002_add_node_presets_json.sql` — fails with *duplicate column* if already applied; that is safe to ignore.

New installs use the updated `d1/schema.sql`, which includes these columns.
