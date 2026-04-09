import { hashPassword } from '../../../lib/trading/auth';
import { createTradingUser, getTradingUserByEmail } from '../../../lib/trading/db';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const displayName = String(req.body?.displayName || '').trim();
  const password = String(req.body?.password || '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (displayName.length < 2) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const existingUser = await getTradingUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'This email is already registered. Please sign in instead.',
        code: 'USER_EXISTS',
      });
    }

    const { salt, hash } = hashPassword(password);
    const user = await createTradingUser({
      email,
      displayName,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'member',
    });

    return res.status(201).json({
      ok: true,
      user: {
        id: user?.id || null,
        email,
        displayName,
      },
    });
  } catch (error) {
    const message = error.message || 'Unable to register account';
    if (message.toLowerCase().includes('duplicate') || message.includes('23505')) {
      return res.status(409).json({
        error: 'This email is already registered. Please sign in instead.',
        code: 'USER_EXISTS',
      });
    }
    return res.status(500).json({ error: message });
  }
}
