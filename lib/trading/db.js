const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function baseHeaders() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Missing Supabase server configuration');
  }
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...baseHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase error: ${response.status} ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function insertTradingSignal(signal) {
  const payload = {
    symbol: signal.symbol,
    strategy: signal.strategy,
    action: signal.action,
    entry_price: signal.entryPrice,
    stop_loss: signal.stopLoss,
    target_price: signal.targetPrice,
    outcome: null,
  };

  const rows = await supabase('trading_signals', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });

  return rows?.[0] || null;
}

export async function getSignalStats(symbol, strategy) {
  const params = new URLSearchParams({
    symbol: `eq.${symbol}`,
    strategy: `eq.${strategy}`,
    order: 'created_at.desc',
    limit: '50',
    select: 'entry_price,exit_price,outcome',
  });

  const rows = await supabase(`trading_signals?${params.toString()}`, { method: 'GET' });
  const decided = (rows || []).filter((r) => r.outcome === 'WIN' || r.outcome === 'LOSS');
  const wins = decided.filter((r) => r.outcome === 'WIN').length;
  const sampleSize = decided.length;
  const winRate = sampleSize ? (wins / sampleSize) * 100 : 50;

  const returns = decided
    .filter((r) => r.entry_price && r.exit_price)
    .map((r) => ((r.exit_price - r.entry_price) / r.entry_price) * 100);
  const avgReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;

  return {
    win_rate: winRate,
    avg_return: avgReturn,
    sample_size: sampleSize,
  };
}

export async function getPendingSignals(hoursOld = 24) {
  const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    outcome: 'is.null',
    created_at: `lt.${cutoff}`,
    select: 'id,symbol,action,entry_price,stop_loss,target_price,created_at',
    limit: '500',
  });
  return supabase(`trading_signals?${params.toString()}`, { method: 'GET' });
}

export async function updateSignalOutcome(id, outcome, exitPrice) {
  const params = new URLSearchParams({ id: `eq.${id}` });
  return supabase(`trading_signals?${params.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      outcome,
      exit_price: exitPrice,
      evaluated_at: new Date().toISOString(),
    }),
  });
}

export async function getActiveSubscribers() {
  const params = new URLSearchParams({
    subscriber_state: 'eq.active',
    select: 'email',
    limit: '5000',
  });
  return supabase(`subscribers?${params.toString()}`, { method: 'GET' });
}

export async function getSiteContent(key) {
  const params = new URLSearchParams({ key: `eq.${key}`, select: 'id,key,content' });
  const rows = await supabase(`site_content?${params.toString()}`, { method: 'GET' });
  return rows?.[0] || null;
}

export async function upsertSiteContent(key, content) {
  return supabase('site_content', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ key, content, updated_at: new Date().toISOString() }]),
  });
}
