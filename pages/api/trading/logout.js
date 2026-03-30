import { getCookieName } from '../../../lib/trading/auth';

export default async function handler(req, res) {
  const cookieName = getCookieName();
  const isProd = process.env.NODE_ENV === 'production';

  res.setHeader(
    'Set-Cookie',
    `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${isProd ? 'Secure;' : ''}`,
  );

  return res.status(200).json({ ok: true });
}
