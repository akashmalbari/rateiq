import {
  createSessionToken,
  getCookieName,
  verifyPassword,
} from '../../../lib/trading/auth';
import { getTradingUserByEmail, updateTradingUserLastLogin } from '../../../lib/trading/db';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  try {
    const user = await getTradingUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'This account is not active. Please contact support.' });
    }

    const token = createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.display_name,
      role: user.role || 'member',
      exp: Date.now() + 1000 * 60 * 60 * 12,
    });

    const cookieName = getCookieName();
    const isProd = process.env.NODE_ENV === 'production';

    res.setHeader(
      'Set-Cookie',
      `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}; ${isProd ? 'Secure;' : ''}`,
    );

    updateTradingUserLastLogin(user.id).catch((error) => {
      console.warn('[api/trading/login] unable to update last login', error);
    });

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to login' });
  }
}
