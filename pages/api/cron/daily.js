import { getDailySignalsReport } from '../../../lib/trading/daily-report';
import { buildDailySignalsEmail, sendResendEmail } from '../../../lib/trading/mailer';
import { getSiteContent, upsertSiteContent } from '../../../lib/trading/db';

const IDEMPOTENCY_KEY = 'daily_signals_last_sent';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCronSecret() {
  return process.env.CRON_SECRET || '';
}

function isVercelCronRequest(req) {
  return req.headers['x-vercel-cron'] === '1';
}

function hasValidSecret(req) {
  const secret = getCronSecret();
  if (!secret) return false;

  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const querySecret = typeof req.query?.secret === 'string' ? req.query.secret : '';

  return bearer === secret || querySecret === secret;
}

function isAuthorized(req) {
  return isVercelCronRequest(req) || hasValidSecret(req);
}

function wantsForceRun(req) {
  return req.query?.force === '1' || req.query?.force === 'true';
}

function getRecipientsFromEnv() {
  const raw = process.env.DAILY_SIGNALS_RECIPIENTS || '';
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized cron access' });
  }

  const runDate = todayKey();
  const forceRun = wantsForceRun(req);
  const secretAuth = hasValidSecret(req);

  if (forceRun && !secretAuth) {
    return res.status(403).json({ ok: false, error: 'force run requires CRON_SECRET' });
  }

  try {
    const current = await getSiteContent(IDEMPOTENCY_KEY);
    const lastSent = current?.content?.date;

    if (!forceRun && lastSent === runDate) {
      console.log('[cron/daily] already sent for date', runDate);
      return res.status(200).json({ ok: true, skipped: true, reason: 'already_sent_today' });
    }

    const { signals } = await getDailySignalsReport();
    if (!signals.length) {
      console.log('[cron/daily] no qualifying signals');
      return res.status(200).json({ ok: true, skipped: true, reason: 'no_signals' });
    }

    const recipients = getRecipientsFromEnv();

    if (!recipients.length) {
      console.log('[cron/daily] no recipients configured in DAILY_SIGNALS_RECIPIENTS');
      return res.status(200).json({ ok: true, skipped: true, reason: 'no_recipients_configured' });
    }

    const html = buildDailySignalsEmail(signals);
    await sendResendEmail({
      to: recipients,
      subject: `Morning Signals — ${runDate}`,
      html,
    });

    await upsertSiteContent(IDEMPOTENCY_KEY, {
      date: runDate,
      sent_at: new Date().toISOString(),
      count: recipients.length,
      signals: signals.map((s) => ({ symbol: s.symbol, action: s.action, confidence: s.confidence })),
    });

    console.log('[cron/daily] sent', { recipients: recipients.length, signals: signals.length });

    return res.status(200).json({
      ok: true,
      sent: true,
      forced: forceRun,
      recipients: recipients.length,
      signals: signals.length,
    });
  } catch (error) {
    console.error('[cron/daily] failed', error);
    return res.status(500).json({ ok: false, error: error.message || 'cron failed' });
  }
}
