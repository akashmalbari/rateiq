import { createSessionToken, getCookieName } from '../../../lib/trading/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const validUser = process.env.TRADING_ADMIN_USERNAME;
  const validPass = process.env.TRADING_ADMIN_PASSWORD;

  if (!validUser || !validPass) {
    return res.status(500).json({ error: 'Admin credentials are not configured on server' });
  }

  if (username !== validUser || password !== validPass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createSessionToken({
    sub: username,
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });

  const cookieName = getCookieName();
  const isProd = process.env.NODE_ENV === 'production';

  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}; ${isProd ? 'Secure;' : ''}`,
  );

  return res.status(200).json({ ok: true });
}
