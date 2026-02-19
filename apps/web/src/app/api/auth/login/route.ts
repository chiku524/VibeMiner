import { NextResponse } from 'next/server';
import {
  getEnv,
  verifyPassword,
  createSession,
  sessionCookieHeader,
} from '@/lib/auth-server';

const SERVICE_UNAVAILABLE_MESSAGE =
  'Sign-in service is temporarily unavailable. Please try again in a moment or contact support.';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    let env: Awaited<ReturnType<typeof getEnv>>;
    try {
      env = await getEnv();
    } catch (err) {
      console.error('Login getEnv error:', err);
      return NextResponse.json({ error: SERVICE_UNAVAILABLE_MESSAGE }, { status: 503 });
    }

    const { DB } = env;

    const row = await DB.prepare(
      'select id, email, password_hash, account_type, display_name, network_name, network_website, created_at, updated_at from users where email = ?'
    )
      .bind(email.toLowerCase())
      .first();

    if (!row) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const [saltHex, hashHex] = (row.password_hash as string).split(':');
    const valid = await verifyPassword(password, saltHex, hashHex);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    let token: string;
    try {
      token = await createSession(row.id as string);
    } catch (sessionErr) {
      console.error('Login createSession error:', sessionErr);
      return NextResponse.json({ error: SERVICE_UNAVAILABLE_MESSAGE }, { status: 503 });
    }

    const response = NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        account_type: row.account_type,
        display_name: row.display_name,
        network_name: row.network_name,
        network_website: row.network_website,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    });
    response.headers.set('Set-Cookie', sessionCookieHeader(token));
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Sign-in failed. Please try again or contact support if it persists.' },
      { status: 500 }
    );
  }
}
