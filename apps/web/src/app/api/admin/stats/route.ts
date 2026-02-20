import { NextResponse } from 'next/server';
import { getSessionCookie, getUserIdFromSession, getEnv } from '@/lib/auth-server';

/** GET /api/admin/stats — admin only. Returns user count, network count, etc. */
export async function GET(request: Request) {
  try {
    const token = getSessionCookie(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = await getUserIdFromSession(token);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { DB } = await getEnv();
    const adminRow = await DB.prepare('select 1 from admin_users where user_id = ?').bind(userId).first();
    if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [usersResult, networksResult] = await Promise.all([
      DB.prepare('select count(*) as count from users').first(),
      DB.prepare('select count(*) as count from network_listings').first(),
    ]);

    return NextResponse.json({
      users: Number((usersResult as { count: number })?.count ?? 0),
      network_listings: Number((networksResult as { count: number })?.count ?? 0),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
