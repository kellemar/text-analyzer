import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { loginSchema, signupSchema } from '../validators';
import { getPool } from '../db';
import { hashToken } from '../auth';
import { setCookie } from 'hono/cookie';

export const registerAuthRoutes = (app: Hono) => {
  app.post('/login', async c => {
    const body = await c.req.json().catch(() => ({}));
    const parse = loginSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ error: 'Invalid email or password' }, 400);
    }
    const { email, password } = parse.data;
    const db = getPool();
    const userResult = await db.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email.trim().toLowerCase()],
    );

    if (userResult.rows.length === 0) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const accessToken = crypto.randomBytes(64).toString('hex');
    const accessTokenHash = hashToken(accessToken);

    const user_agent = c.req.header('user-agent') || null;
    const forwarded_for = c.req.header('x-forwarded-for');
    const ip_address = forwarded_for
      ? forwarded_for.split(',')[0].trim()
      : c.req.header('x-real-ip') || null;
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const sessionResult = await db.query(
      'INSERT INTO sessions (user_id, access_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, expires_at',
      [user.id, accessTokenHash, user_agent, ip_address, expires_at],
    );

    setCookie(c, 'access_token', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return c.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        session: {
          access_token: accessToken,
          expires_at: sessionResult.rows[0].expires_at,
        },
      },
      200,
    );
  });

  app.post('/signup', async c => {
    const body = await c.req.json().catch(() => ({}));
    const parse = signupSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ error: 'Invalid email or password' }, 400);
    }
    const { email, password } = parse.data;

    const db = getPool();
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.trim().toLowerCase()],
    );
    if (existingUser.rows.length > 0) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const userResult = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.trim().toLowerCase(), password_hash],
    );
    const user = userResult.rows[0];

    const accessToken = crypto.randomBytes(64).toString('hex');
    const accessTokenHash = hashToken(accessToken);

    const user_agent = c.req.header('user-agent') || null;
    const forwarded_for = c.req.header('x-forwarded-for');
    const ip_address = forwarded_for
      ? forwarded_for.split(',')[0].trim()
      : c.req.header('x-real-ip') || null;
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const sessionResult = await db.query(
      'INSERT INTO sessions (user_id, access_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, expires_at',
      [user.id, accessTokenHash, user_agent, ip_address, expires_at],
    );

    setCookie(c, 'access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return c.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        session: {
          access_token: accessToken,
          expires_at: sessionResult.rows[0].expires_at,
        },
      },
      201,
    );
  });
};
