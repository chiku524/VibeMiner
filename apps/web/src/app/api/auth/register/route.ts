import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import {
  getEnv,
  hashPassword,
  generateId,
  createSession,
  sessionCookieHeader,
  type AccountType,
} from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      accountType,
      displayName,
      networkName,
      networkWebsite,
    } = body as {
      email?: string;
      password?: string;
      accountType?: AccountType;
      displayName?: string;
      networkName?: string;
      networkWebsite?: string;
    };

    if (!email || !password || !accountType) {
      return NextResponse.json(
        { error: 'Missing email, password, or accountType' },
        { status: 400 }
      );
    }
    if (accountType !== 'user' && accountType !== 'network') {
      return NextResponse.json({ error: 'Invalid accountType' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    let env: Awaited<ReturnType<typeof getEnv>>;
    try {
      env = await getEnv();
    } catch (err) {
      console.error('Register getEnv error:', err);
      return NextResponse.json(
        { error: 'Auth service temporarily unavailable. Please try again in a moment or contact support.' },
        { status: 503 }
      );
    }

    const { DB } = env;

    const existing = await DB.prepare('select id from users where email = ?')
      .bind(email.toLowerCase())
      .first();
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const salt = randomBytes(16);
    const hash = await hashPassword(password, salt);
    const saltHex = salt.toString('hex');
    const passwordStore = `${saltHex}:${hash}`;

    const id = generateId();
    await DB.prepare(
      `insert into users (id, email, password_hash, account_type, display_name, network_name, network_website)
       values (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        email.toLowerCase(),
        passwordStore,
        accountType,
        accountType === 'user' ? (displayName || null) : null,
        accountType === 'network' ? (networkName || null) : null,
        accountType === 'network' && networkWebsite ? networkWebsite : null
      )
      .run();

    const token = await createSession(id);
    const userRow = await DB.prepare(
      'select id, email, account_type, display_name, network_name, network_website, created_at, updated_at from users where id = ?'
    )
      .bind(id)
      .first();

    if (!userRow) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const response = NextResponse.json({
      user: {
        id: userRow.id,
        email: userRow.email,
        account_type: userRow.account_type,
        display_name: userRow.display_name,
        network_name: userRow.network_name,
        network_website: userRow.network_website,
        created_at: userRow.created_at,
        updated_at: userRow.updated_at,
      },
    });
    response.headers.set('Set-Cookie', sessionCookieHeader(token));
    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: 'Registration failed. Please try again or contact support if it persists.' },
      { status: 500 }
    );
  }
}
