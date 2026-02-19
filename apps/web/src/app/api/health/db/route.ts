import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/auth-server';

/**
 * GET /api/health/db
 * Verifies D1 and KV are bound and reachable (e.g. after deploy).
 * Returns 503 if Cloudflare context is missing; 200 with ok/d1/kv flags otherwise.
 */
export async function GET() {
  try {
    const { DB, KV } = await getEnv();

    // D1: run a trivial query (no table required)
    let d1Ok = false;
    try {
      const row = await DB.prepare('SELECT 1 as ok').first();
      d1Ok = row != null && (row as { ok?: number }).ok === 1;
    } catch (e) {
      console.error('[health/db] D1 check failed:', e);
    }

    // D1 schema: ensure users table exists (registration needs it)
    let usersTableExists = false;
    if (d1Ok) {
      try {
        await DB.prepare('SELECT 1 FROM users LIMIT 1').first();
        usersTableExists = true;
      } catch {
        // Table might not exist if schema wasn't applied
      }
    }

    // KV: short-lived test key
    let kvOk = false;
    try {
      const testKey = `health:${Date.now()}`;
      await KV.put(testKey, 'pong', { expirationTtl: 60 });
      const val = await KV.get(testKey);
      kvOk = val === 'pong';
      await KV.delete(testKey);
    } catch (e) {
      console.error('[health/db] KV check failed:', e);
    }

    const ok = d1Ok && usersTableExists && kvOk;
    return NextResponse.json(
      {
        ok,
        d1: d1Ok,
        usersTable: usersTableExists,
        kv: kvOk,
        ...(ok ? {} : { hint: usersTableExists ? 'Check D1/KV bindings and logs.' : 'Apply D1 schema: wrangler d1 execute vibeminer-db --remote --file=./d1/schema.sql' }),
      },
      { status: ok ? 200 : 503 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[health/db] getEnv or check failed:', message);
    return NextResponse.json(
      {
        ok: false,
        d1: false,
        kv: false,
        error: message.includes('Cloudflare context') ? 'Auth service not available (run on Cloudflare or wrangler preview).' : 'Health check failed.',
      },
      { status: 503 }
    );
  }
}
