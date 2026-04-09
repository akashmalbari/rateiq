import crypto from 'crypto';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase server configuration');
  }

  return { url, serviceRoleKey };
}

function getUnsubscribeSecret() {
  return process.env.TRADING_SESSION_SECRET || process.env.CRON_SECRET || 'dev-unsubscribe-secret-change-me';
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function signEmail(email) {
  return crypto.createHmac('sha256', getUnsubscribeSecret()).update(email).digest('hex');
}

function isValidToken(email, token) {
  if (!email || !token) return false;
  const expected = signEmail(email);

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(token)));
  } catch {
    return false;
  }
}

async function supabaseRequest(path, options = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function unsubscribeEmail(email) {
  const params = new URLSearchParams({
    email: `eq.${email}`,
  });

  await supabaseRequest(`subscribers?${params.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      subscriber_state: 'unsubscribed',
      updated_at: new Date().toISOString(),
    }),
  });
}

function renderHtml({ ok, message }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Figure My Money — Unsubscribe</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; }
      .wrap { max-width: 680px; margin: 56px auto; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 28px; }
      h1 { margin-top: 0; font-size: 24px; }
      p { line-height: 1.7; color: #334155; }
      .ok { color: #166534; }
      .error { color: #b91c1c; }
      a { color: #0f766e; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>${ok ? 'You have been unsubscribed' : 'Unable to unsubscribe'}</h1>
      <p class="${ok ? 'ok' : 'error'}">${message}</p>
      <p>If this was a mistake, you can subscribe again from the site footer.</p>
      <p><a href="/">Return to Figure My Money</a></p>
    </main>
  </body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = normalizeEmail(req.query?.email);
  const token = String(req.query?.token || '');

  if (!email || !token || !isValidToken(email, token)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(renderHtml({ ok: false, message: 'Invalid or expired unsubscribe link.' }));
  }

  try {
    await unsubscribeEmail(email);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtml({ ok: true, message: `Email ${email} will no longer receive daily signals.` }));
  } catch (error) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(renderHtml({ ok: false, message: error.message || 'Something went wrong.' }));
  }
}
