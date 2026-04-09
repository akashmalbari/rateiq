import crypto from 'crypto';

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://figuremymoney.com').replace(/\/$/, '');
}

function getUnsubscribeSecret() {
  return process.env.TRADING_SESSION_SECRET || process.env.CRON_SECRET || 'dev-unsubscribe-secret-change-me';
}

function createUnsubscribeToken(email) {
  return crypto.createHmac('sha256', getUnsubscribeSecret()).update(String(email || '').trim().toLowerCase()).digest('hex');
}

function unsubscribeLink(email) {
  const safeEmail = String(email || '').trim().toLowerCase();
  const token = createUnsubscribeToken(safeEmail);
  return `${getSiteUrl()}/api/unsubscribe?email=${encodeURIComponent(safeEmail)}&token=${encodeURIComponent(token)}`;
}

function signalCard(signal) {
  return `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:12px;background:#ffffff;">
      <div style="font-size:18px;font-weight:700;margin-bottom:8px;">${signal.symbol} — ${signal.action}</div>
      <div style="font-size:14px;line-height:1.7;color:#111827;">
        Entry: <strong>$${Number(signal.entryPrice).toFixed(2)}</strong><br/>
        Target: <strong>$${Number(signal.targetPrice).toFixed(2)}</strong><br/>
        Stop: <strong>$${Number(signal.stopLoss).toFixed(2)}</strong><br/>
        Confidence: <strong>${signal.confidence}%</strong> · Win Rate: ${signal.winRate}% (n=${signal.sampleSize})
      </div>
      <ul style="margin:10px 0 0 16px;padding:0;color:#374151;font-size:13px;line-height:1.6;">
        ${(signal.reasons || []).slice(0, 2).map((r) => `<li>${r}</li>`).join('')}
      </ul>
    </div>
  `;
}

export function buildDailySignalsEmail(signals) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:20px;color:#111827;">
      <h1 style="margin:0 0 14px;font-size:22px;">Figure My Money — Morning Signals</h1>
      <p style="margin:0 0 16px;color:#4b5563;">Top trading signals for today based on tracked strategy outcomes.</p>
      ${signals.map(signalCard).join('')}
      <p style="margin-top:16px;font-size:12px;color:#6b7280;">For informational use only. Not financial advice.</p>
    </div>
  `;
}

export async function sendResendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'signals@figuremymoney.com';

  if (!key) throw new Error('Missing RESEND_API_KEY');

  const recipients = Array.isArray(to) ? to : [to];
  const cleaned = recipients.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean);

  if (!cleaned.length) {
    throw new Error('No recipients provided');
  }

  const results = [];

  for (const recipient of cleaned) {
    const footer = `
      <hr style="margin-top:22px;border:none;border-top:1px solid #e5e7eb;" />
      <p style="margin-top:12px;font-size:12px;color:#6b7280;line-height:1.6;">
        To stop receiving these emails, <a href="${unsubscribeLink(recipient)}">unsubscribe here</a>.
      </p>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipient,
        subject,
        html: `${html}${footer}`,
      }),
    });

    const raw = await response.text();
    let payload = {};

    if (typeof raw === 'string' && raw.trim()) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = { raw };
      }
    }

    if (!response.ok) {
      throw new Error(`Resend send failed for ${recipient}: ${response.status} ${JSON.stringify(payload)}`);
    }

    results.push({ recipient, payload });
  }

  return { sent: results.length, results };
}
