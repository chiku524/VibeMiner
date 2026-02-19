# Deploying the web app to Vercel (monorepo)

The web app lives in `apps/web` and depends on the workspace package `@vibeminer/shared`. For the build to succeed, Vercel must install from the **repository root** so that the shared package is available.

## Project settings

1. **Root Directory:** `apps/web`
2. **Include source files outside of the Root Directory:** **Enabled**  
   (In Project Settings → General → Root Directory, check the option so the full repo is available during the build. Without this, `cd ../..` in the install command may not see the rest of the monorepo.)
3. **Install Command / Build Command:** Leave as default; they are overridden by `apps/web/vercel.json`:
   - **Install:** `cd ../.. && npm install` (runs from repo root)
   - **Build:** `cd ../.. && npm run build` (builds shared then web)

If the build still fails with `Module not found: '@vibeminer/shared'`, confirm that:
- The option **Include source files outside of the Root Directory** is enabled.
- The latest commit (with `apps/web/vercel.json`) is deployed.

No need to set Install or Build Command in the Vercel dashboard unless you want to override the file; the `vercel.json` in `apps/web` applies when Root Directory is `apps/web`.
