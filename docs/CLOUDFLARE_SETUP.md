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

Wrangler needs your **account ID** for remote commands. Set it in **apps/web/.env** (create the file if it doesn’t exist; it’s gitignored):

```bash
# apps/web/.env (do not commit; use your real account ID)
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

You can copy your account ID from the Cloudflare dashboard URL when you open any zone, or from **Workers & Pages** in the right-hand sidebar.

Run the schema from **apps/web** (use `--local` for local dev, `--remote` for production):

```bash
cd apps/web

# Local (for wrangler dev / preview)
npx wrangler d1 execute vibeminer-db --local --file=./d1/schema.sql

# Remote (for production deploy) — requires CLOUDFLARE_ACCOUNT_ID in .env or environment
npx wrangler d1 execute vibeminer-db --remote --file=./d1/schema.sql
```

If you see **"Could not route to ... INJECT_ACCOUNT_ID"** or **"object identifier is invalid"**, the account ID is missing: add `CLOUDFLARE_ACCOUNT_ID` to `apps/web/.env` and run the command again from `apps/web`.

Or from the repo root, use the full path (and ensure `.env` in `apps/web` has `CLOUDFLARE_ACCOUNT_ID`):

```bash
cd apps/web && npx wrangler d1 execute vibeminer-db --remote --file=./d1/schema.sql
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

## 9. HTTPS / “Not secure” warning

Browsers show “Not secure” when the page is loaded over **HTTP** or the **SSL certificate** is invalid or still provisioning. Fix it as follows:

1. **Always use https://**  
   Open **https://vibeminer.tech** (and **https://www.vibeminer.tech**). If you use `http://`, the browser will treat the site as not secure.

2. **DNS proxied through Cloudflare**  
   In the Cloudflare dashboard, go to **vibeminer.tech** → **DNS** → **Records**. For the records that point to your Worker (or to the target you use for the Worker), the cloud icon should be **orange (Proxied)**. If it’s grey (DNS only), traffic is not going through Cloudflare and won’t get Cloudflare’s SSL.

3. **SSL/TLS mode**  
   Go to **vibeminer.tech** → **SSL/TLS**. Set the encryption mode to **Full** or **Full (strict)** so traffic between the browser and Cloudflare is HTTPS.

4. **Wait for the certificate**  
   After adding the custom domain to the Worker, Cloudflare issues an edge certificate. That can take a few minutes. In **SSL/TLS** → **Edge Certificates**, check that the certificate for vibeminer.tech (and www.vibeminer.tech) is **Active**. Until it is, you may see “Not secure” or certificate errors.

5. **Redirect HTTP → HTTPS**  
   In **SSL/TLS** → **Edge Certificates**, turn **Always Use HTTPS** **On**. Then `http://vibeminer.tech` will redirect to `https://vibeminer.tech`.

After the edge certificate is Active and you use **https://**, the site should show as secure (padlock) in the browser.

## 10. Troubleshooting registration and auth

If **Register** or **Login** fails with "Registration failed" or "Auth service temporarily unavailable":

1. **Apply D1 schema to production**  
   Registration and login need the `users` table. If you only ran the schema with `--local`, run it for the **remote** database:
   ```bash
   cd apps/web
   npx wrangler d1 execute vibeminer-db --remote --file=./d1/schema.sql
   ```

2. **Check DB and KV health**  
   Open **https://vibeminer.tech/api/health/db** in a browser (or `curl https://vibeminer.tech/api/health/db`). You should see:
   - `"ok": true`, `"d1": true`, `"usersTable": true`, `"kv": true`  
   If `usersTable` is `false`, apply the schema (step 1). If `ok` is `false` or you get 503, check Worker bindings (D1 database_id, KV id) in `wrangler.toml` and in the Cloudflare dashboard under the **vibeminer** Worker.

3. **Redeploy**  
   After fixing bindings or schema, run `npm run deploy:cloudflare` from the repo root (or trigger the GitHub Actions deploy).

## 11. Error 1027 (rate limited / plan limits)

If the site shows **Error 1027** (“This website has been temporarily rate limited” / “owner has reached their plan limits”), the **Worker request limit** for your plan has been hit—not the KV namespace limit.

- **Worker limit**: Every request that hits the Worker (HTML pages, API routes like `/api/auth/session`) counts as one invocation. On the free plan you get a fixed number of invocations per day; exceeding it triggers 1027 for the whole site.
- **KV limit**: The SESSIONS KV namespace has its own read/write limit. When *KV* hits its limit, the site can still load; only auth (login/register/session) may fail with 503 or errors. So “website loads but KV is capped” (e.g. on your video project) is expected; 1027 is about Worker invocations.

**Why this app can hit the Worker limit sooner**

Every page load and client navigation that needs server data goes through the same Worker (document + `/api/auth/session` + any API calls). We keep **static assets** (JS/CSS/images) from counting as invocations by setting **`run_worker_first = false`** in `wrangler.toml` under `[assets]`, so the edge serves those without running the Worker. If that was ever `true` or omitted in a deploy, every asset request would count and 1027 would happen quickly.

**What to do**

1. In **Cloudflare Dashboard** → **Workers & Pages** → **vibeminer** (or your account overview), check **Usage** / **Analytics** to see Worker requests per day and confirm you’re hitting the cap.
2. Ensure `apps/web/wrangler.toml` has `run_worker_first = false` under `[assets]` and redeploy so asset requests are not billed.
3. Upgrade the Workers plan if you need more invocations, or reduce traffic/crawling that hits the Worker.

## 12. Download page (/download)

The **/download** page shows Windows, macOS, and Linux desktop installers. It tries to load the latest links from the **GitHub Releases API**. If that request fails (e.g. rate limit for unauthenticated requests), it falls back to the URLs in **wrangler.toml** [vars]: `NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN`, `_MAC`, `_LINUX`. Those are set to the latest release (e.g. v1.0.15) so the page always shows three download options after deploy.

**Optional:** To use the live GitHub API so the page always shows the newest release without editing wrangler.toml, add a **secret** in the Cloudflare dashboard (Workers & Pages → vibeminer → Settings → Variables → Encrypt): **GITHUB_TOKEN** with a [personal access token](https://github.com/settings/tokens) (no scopes required for public repo). Then the server can call the API with a higher rate limit and return the latest release’s installers.

## Admin and user wallets

- **admin_users**: Table listing `user_id`s who can access `/dashboard/admin`. Add your user id after signup to become admin. See [USER_WALLETS_AND_ADMIN.md](./USER_WALLETS_AND_ADMIN.md).
- **miner_balances**: In-platform balance per miner per network; rewards accumulate here. Withdrawal to external wallet incurs the platform fee (see /fees). Run the migration `d1/migrations/001_admin_and_miner_balances.sql` on existing DBs if you already ran the original schema.

## Summary

| Resource   | Purpose                                                    |
|-----------|-------------------------------------------------------------|
| **D1**    | Users, network_listings, admin_users, miner_balances       |
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
