import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/auth-server';

const FILE_RE = /^[a-f0-9]{32}\.(png|jpg|jpeg|webp)$/i;

/**
 * Public read of a listing logo from R2 (uploaded via POST /api/networks/icon).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file } = await params;
    if (!file || !FILE_RE.test(file)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { R2 } = await getEnv();
    const key = `network-icons/${file}`;
    const obj = await R2.get(key);
    if (!obj) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const contentType = obj.httpMetadata?.contentType ?? 'application/octet-stream';
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400, immutable');

    return new NextResponse(obj.body, { status: 200, headers });
  } catch (e) {
    console.error('network-icons GET:', e);
    return NextResponse.json({ error: 'Not available' }, { status: 503 });
  }
}
