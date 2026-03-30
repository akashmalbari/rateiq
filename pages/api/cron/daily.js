import { getDailySignalsReport } from '../../../lib/trading/daily-report';
import { buildDailySignalsEmail, sendResendEmail } from '../../../lib/trading/mailer';
import { getActiveSubscribers, getSiteContent, upsertSiteContent } from '../../../lib/trading/db';

const IDEMPOTENCY_KEY = 'daily_signals_last_sent';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const runDate = todayKey();

  try {
    const current = await getSiteContent(IDEMPOTENCY_KEY);
    const lastSent = current?.content?.date;

    if (lastSent === runDate) {
      console.log('[cron/daily] already sent for date', runDate);
      return res.status(200).json({ ok: true, skipped: true, reason: 'already_sent_today' });
    }

    const { signals } = await getDailySignalsReport();
    if (!signals.length) {
      console.log('[cron/daily] no qualifying signals');
      return res.status(200).json({ ok: true, skipped: true, reason: 'no_signals' });
    }

    const subscribers = await getActiveSubscribers();
    const recipients = (subscribers || []).map((row) => row.email).filter(Boolean);

    if (!recipients.length) {
      console.log('[cron/daily] no active subscribers');
      return res.status(200).json({ ok: true, skipped: true, reason: 'no_recipients' });
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

    return res.status(200).json({ ok: true, sent: true, recipients: recipients.length, signals: signals.length });
  } catch (error) {
    console.error('[cron/daily] failed', error);
    return res.status(500).json({ ok: false, error: error.message || 'cron failed' });
  }
}
