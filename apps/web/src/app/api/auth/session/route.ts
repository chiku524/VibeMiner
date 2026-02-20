import { NextResponse } from 'next/server';
import { getSessionCookie, getUserIdFromSession, getEnv } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const { DB } = await getEnv();
    const row = await DB.prepare(
      'select u.id, u.email, u.account_type, u.display_name, u.network_name, u.network_website, u.created_at, u.updated_at, (select 1 from admin_users a where a.user_id = u.id limit 1) as is_admin from users u where u.id = ?'
    )
      .bind(userId)
      .first();

    if (!row) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        account_type: row.account_type,
        display_name: row.display_name,
        network_name: row.network_name,
        network_website: row.network_website,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_admin: !!row.is_admin,
      },
    });
  } catch (err) {
    console.error('Session error:', err);
    return NextResponse.json({ user: null });
  }
}
