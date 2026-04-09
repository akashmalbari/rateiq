import crypto from 'crypto';

const COOKIE_NAME = 'fmm_trading_admin';
const TRADING_ROLES = new Set(['admin', 'member', 'user']);

function getSecret() {
  return process.env.TRADING_SESSION_SECRET || 'dev-trading-secret-change-me';
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

export function createSessionToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = sign(body);
  if (sig !== expected) return null;

  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx);
      const value = decodeURIComponent(part.slice(idx + 1));
      acc[key] = value;
      return acc;
    }, {});
}

export function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[getCookieName()];
  return verifySessionToken(token);
}

export function hasTradingAccess(session) {
  return Boolean(session?.sub && session?.role && TRADING_ROLES.has(session.role));
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;

  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
