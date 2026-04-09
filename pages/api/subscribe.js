function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase server configuration');
  }

  return { url, serviceRoleKey };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

async function findSubscriber(email) {
  const params = new URLSearchParams({
    email: `eq.${email}`,
    select: 'id,email,subscriber_state',
    limit: '1',
  });

  const rows = await supabaseRequest(`subscribers?${params.toString()}`, { method: 'GET' });
  return rows?.[0] || null;
}

async function activateSubscriber(email, source) {
  const existing = await findSubscriber(email);

  if (!existing) {
    await supabaseRequest('subscribers', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify([
        {
          email,
          subscriber_state: 'active',
          source: source || 'site',
          updated_at: new Date().toISOString(),
        },
      ]),
    });
    return { status: 'created' };
  }

  if (existing.subscriber_state === 'active') {
    return { status: 'already_active' };
  }

  const params = new URLSearchParams({ id: `eq.${existing.id}` });
  await supabaseRequest(`subscribers?${params.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      subscriber_state: 'active',
      source: source || 'site',
      updated_at: new Date().toISOString(),
    }),
  });

  return { status: 'reactivated' };
}

async function deactivateSubscriber(email) {
  const existing = await findSubscriber(email);

  if (!existing) {
    return { status: 'not_found' };
  }

  if (existing.subscriber_state !== 'active') {
    return { status: 'already_inactive' };
  }

  const params = new URLSearchParams({ id: `eq.${existing.id}` });
  await supabaseRequest(`subscribers?${params.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      subscriber_state: 'inactive',
      updated_at: new Date().toISOString(),
    }),
  });

  return { status: 'deactivated' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const emailRaw = req.body?.email;
    const sourceRaw = req.body?.source;

    if (typeof emailRaw !== 'string' || !emailRaw.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const email = emailRaw.trim().toLowerCase();
    const source = typeof sourceRaw === 'string' ? sourceRaw.trim().slice(0, 80) : 'site';

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result =
      req.method === 'POST'
        ? await activateSubscriber(email, source)
        : await deactivateSubscriber(email);

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Subscribe request failed' });
  }
}
