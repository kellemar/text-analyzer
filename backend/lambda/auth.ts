import { Context, Next } from 'hono';
import crypto from 'crypto';
import { getPool } from './db';

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const auth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const tokenHash = hashToken(token);

  try {
    const db = getPool();
    const sessionResult = await db.query(
      'SELECT id, user_id, expires_at FROM sessions WHERE access_token = $1',
      [tokenHash],
    );

    if (sessionResult.rows.length === 0) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = sessionResult.rows[0];
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return c.json({ error: 'Session expired' }, 401);
    }

    await next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
};
