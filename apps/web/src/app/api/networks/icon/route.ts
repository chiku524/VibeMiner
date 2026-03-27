import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getEnv, getSessionCookie, getUserIdFromSession } from '@/lib/auth-server';

const MAX_BYTES = 512 * 1024;
const ALLOWED_TYPES = new Map<string, 'image/png' | 'image/jpeg' | 'image/webp'>([
  ['image/png', 'image/png'],
  ['image/jpeg', 'image/jpeg'],
  ['image/jpg', 'image/jpeg'],
  ['image/webp', 'image/webp'],
]);

function detectImageType(buf: ArrayBuffer): 'png' | 'jpeg' | 'webp' | null {
  const u = new Uint8Array(buf);
  if (u.length >= 8 && u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47) return 'png';
  if (u.length >= 3 && u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return 'jpeg';
  if (
    u.length >= 12 &&
    u[0] === 0x52 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x46 &&
    u[8] === 0x57 &&
    u[9] === 0x45 &&
    u[10] === 0x42 &&
    u[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

/**
 * POST multipart/form-data with field `file`: PNG, JPEG, or WebP logo for a network listing.
 * Network accounts only. Stores in R2; returns `{ path: "/api/network-icons/<id>.ext" }`.
 * Previous logos are removed from R2 when you save a new icon (PATCH) or delete the listing.
 */
export async function POST(request: Request) {
  try {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { DB, R2 } = await getEnv();
    const userRow = await DB.prepare('select account_type from users where id = ?').bind(userId).first();
    if (!userRow || (userRow.account_type as string) !== 'network') {
      return NextResponse.json(
        { error: 'Only network accounts can upload a listing logo.' },
        { status: 403 }
      );
    }

    const ct = request.headers.get('content-type') ?? '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Image must be ${MAX_BYTES / 1024} KB or smaller` }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const detected = detectImageType(buf);
    if (!detected) {
      return NextResponse.json({ error: 'File is not a valid PNG, JPEG, or WebP' }, { status: 400 });
    }

    const declared = file.type ? ALLOWED_TYPES.get(file.type) : undefined;
    if (file.type && !declared) {
      return NextResponse.json({ error: 'Only PNG, JPEG, or WebP images are allowed' }, { status: 400 });
    }

    const ext = detected === 'png' ? 'png' : detected === 'webp' ? 'webp' : 'jpg';
    const id = randomBytes(16).toString('hex');
    const key = `network-icons/${id}.${ext}`;
    const contentType =
      detected === 'png' ? 'image/png' : detected === 'webp' ? 'image/webp' : 'image/jpeg';

    await R2.put(key, buf, {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000' },
    });

    const path = `/api/network-icons/${id}.${ext}`;
    return NextResponse.json({ path });
  } catch (e) {
    console.error('network icon upload:', e);
    return NextResponse.json(
      { error: 'Upload failed. Logo upload requires the deployed app (R2 binding).' },
      { status: 500 }
    );
  }
}
