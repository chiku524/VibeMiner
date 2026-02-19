# Cloudflare setup for VibeMiner (vibeminer.tech)

This project uses **Cloudflare D1** (database), **KV** (sessions), and **R2** (storage). The Worker is configured for the custom domain **vibeminer.tech**. Follow these steps to create the project and bindings.

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm i -g wrangler` or use `npx wrangler`)
- Node.js 18+

## 1. Log in to Cloudflare

```bash
cd apps/web
npx wrangler login
```

## 2. Create D1 database

```bash
npx wrangler d1 create vibeminer-db
```

Copy the **database_id** (a UUID) from the output and in `apps/web/wrangler.toml` replace `YOUR_D1_DATABASE_ID` with it. If you skip this, remote D1 schema and deploy will fail with "Invalid uuid".

## 3. Create D1 tables

Run the schema from **apps/web** (use `--local` for local dev, `--remote` for production):

```bash
cd apps/web

# Local (for wrangler dev / preview)
npx wrangler d1 execute vibeminer-db --local --file=./d1/schema.sql

# Remote (for production deploy)
npx wrangler d1 execute vibeminer-db --remote --file=./d1/schema.sql
```

Or from the repo root, use the full path:

```bash
npx wrangler d1 execute vibeminer-db --local --file=apps/web/d1/schema.sql
npx wrangler d1 execute vibeminer-db --remote --file=apps/web/d1/schema.sql
```
(Note: wrangler may resolve paths relative to the current directory; if you get "Unable to read SQL text file", run from `apps/web` as above.)

## 4. Create KV namespace

```bash
npx wrangler kv namespace create SESSIONS
```

Copy the **id** from the output and in `apps/web/wrangler.toml` replace `YOUR_KV_NAMESPACE_ID` with it.

## 5. Create R2 bucket

```bash
npx wrangler r2 bucket create vibeminer-storage
```

No ID needed—R2 uses the bucket name. Your `wrangler.toml` already has:

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "vibeminer-storage"
```

## 6. Local development with bindings

```bash
npm run preview
```

This builds with OpenNext and runs `wrangler dev`, giving you D1, KV, and R2 locally. Auth (register, login, session) will work.

For standard Next.js dev (no bindings):

```bash
npm run dev
```

Auth APIs will fail with “Cloudflare context not available”—use `npm run preview` to test auth locally.

## 7. Create the Worker project (first deploy)

The **vibeminer** project appears in the Cloudflare dashboard only after you deploy. Run from the **repo root** so the shared package is built first (otherwise the build fails with "Can't resolve '@vibeminer/shared'"):

```bash
# From repo root (vibeminer/)
npm run deploy:cloudflare
```

After deploy succeeds, go to **Workers & Pages** in the dashboard—**vibeminer** will be listed. Add your custom domain under **vibeminer** → **Settings** → **Domains** (see step 8). You’ll get a `*.workers.dev` URL, or you can add a [custom domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

**Deploy via GitHub Actions:** Add two repository secrets (Settings → Secrets and variables → Actions): **CLOUDFLARE_API_TOKEN** (create at [profile API tokens](https://dash.cloudflare.com/profile/api-tokens), use “Edit Cloudflare Workers” template) and **CLOUDFLARE_ACCOUNT_ID** (your account ID—stops “Authentication failed” on `/memberships`; find it in the dashboard URL when you open any zone, or in the right-hand sidebar on **Workers & Pages**). Then run **Actions → Deploy to Cloudflare → Run workflow**.

**Deploying on Windows:** If you see "Missing file or directory" with a path ending in `.wasm?module`, deploy from GitHub Actions or WSL instead (see above).

### Pages (alternative)

You can also deploy to [Cloudflare Pages](https://developers.cloudflare.com/pages/) by connecting your Git repo. Configure the build command as `npm run build` and the output directory appropriately, or use the Pages + Workers integration for bindings.

## 8. Custom domain (vibeminer.tech)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), add the domain **vibeminer.tech** (Add site > Enter domain).
2. After the site is active, go to **Workers & Pages** → select the **vibeminer** worker → **Settings** → **Domains & routes** → **Add custom domain** → `vibeminer.tech` (and optionally `www.vibeminer.tech`).
3. Deploy with `npm run deploy` from `apps/web`. The worker will then serve https://vibeminer.tech.

`NEXT_PUBLIC_APP_URL` is set to `https://vibeminer.tech` in `wrangler.toml` [vars]; override with a secret if needed.

## Summary

| Resource   | Purpose                                                    |
|-----------|-------------------------------------------------------------|
| **D1**    | Users, network_listings (automated onboarding)              |
| **KV**    | Session tokens (7-day TTL)                                  |
| **R2**    | File storage (e.g. network logos—future)                    |

## Cloudflare optimizations (already in use)

This setup is already configured for efficiency:

- **D1**: Serverless SQL with no connection pooling; use for users and listings.
- **KV**: Edge key-value store for session tokens (low latency, 7-day TTL).
- **R2**: S3-compatible object storage (no egress fees).
- **Worker**: Single Worker with `nodejs_compat`; OpenNext handles the Next.js runtime.
- **Custom domain**: Add vibeminer.tech in the Worker so traffic goes to your domain with Cloudflare’s edge network.

After the Worker is deployed, you can use the dashboard for **Analytics**, **Logs** (Real-time Logs or Logpush), and **Settings** (environment variables, secrets). For high traffic, consider **Caching** rules and **Rate limiting** in the dashboard.

## Network listings

The `network_listings` table stores blockchain networks registered via the automated API (`POST /api/networks/register`). No admin approval—validation + fee (for mainnet) = instant listing. Re-run the schema to create the table if upgrading.
