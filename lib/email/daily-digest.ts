import { Resend } from "resend";
import { isSupabaseConfigured, publicEnv, resendFrom, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Recommendation, ScanResult } from "@/lib/trading/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderDailyDigestEmail(scan: ScanResult, recommendations: Recommendation[]) {
  const rows = recommendations
    .map(
      (rec) => `
        <tr>
          <td style="padding:18px;border-bottom:1px solid #223041;">
            <strong style="font-size:18px;color:#f8fafc;">${escapeHtml(rec.symbol)}</strong>
            <div style="color:#94a3b8;font-size:12px;">${escapeHtml(rec.companyName)}</div>
          </td>
          <td style="padding:18px;border-bottom:1px solid #223041;color:#e2e8f0;">${escapeHtml(rec.strategyName)}</td>
          <td style="padding:18px;border-bottom:1px solid #223041;color:#86efac;">${rec.probabilityOfProfit.toFixed(1)}%</td>
          <td style="padding:18px;border-bottom:1px solid #223041;color:#fbbf24;">${rec.confidenceScore}</td>
          <td style="padding:18px;border-bottom:1px solid #223041;color:#e2e8f0;">$${rec.maxRisk.toFixed(0)} / $${rec.maxReward.toFixed(0)}</td>
        </tr>`
    )
    .join("");

  const topReasons = recommendations
    .slice(0, 3)
    .map(
      (rec) => `
        <li style="margin-bottom:10px;">
          <strong style="color:#f8fafc;">${escapeHtml(rec.symbol)}:</strong>
          ${escapeHtml(rec.rationale[0] ?? "Setup passed the probability and liquidity model.")}
        </li>`
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#070a0f;color:#e2e8f0;font-family:Inter,Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;">Today's NASDAQ-100 options scan: ${recommendations.length} risk-defined opportunities.</div>
        <main style="max-width:760px;margin:0 auto;padding:32px 16px;">
          <section style="background:#111827;border:1px solid #223041;border-radius:18px;overflow:hidden;">
            <div style="padding:30px;background:linear-gradient(135deg,#111827,#172033);border-bottom:1px solid #223041;">
              <p style="margin:0 0 10px;color:#fbbf24;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Figure My Money Daily Quant Scan</p>
              <h1 style="margin:0;color:#f8fafc;font-size:30px;line-height:1.15;">Top NASDAQ-100 options setups</h1>
              <p style="margin:14px 0 0;color:#94a3b8;line-height:1.6;">
                ${scan.marketRegime.label.replaceAll("_", " ")} regime, ${scan.marketRegime.vixLevel.toFixed(1)} VIX proxy, ${scan.marketRegime.breadth}% breadth.
              </p>
            </div>
            <div style="padding:24px;">
              <table style="width:100%;border-collapse:collapse;background:#0b1220;border-radius:12px;overflow:hidden;">
                <thead>
                  <tr>
                    <th align="left" style="padding:14px 18px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.12em;">Ticker</th>
                    <th align="left" style="padding:14px 18px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.12em;">Strategy</th>
                    <th align="left" style="padding:14px 18px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.12em;">POP</th>
                    <th align="left" style="padding:14px 18px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.12em;">Confidence</th>
                    <th align="left" style="padding:14px 18px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.12em;">Risk / Reward</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <h2 style="color:#f8fafc;font-size:18px;margin:28px 0 12px;">Model reasoning</h2>
              <ul style="margin:0;padding-left:20px;color:#cbd5e1;line-height:1.6;">${topReasons}</ul>
              <p style="margin:28px 0 0;color:#94a3b8;line-height:1.6;">
                Open the dashboard for entry details, Greeks, strike selection, exits, and position sizing.
              </p>
              <p style="margin:18px 0 0;">
                <a href="${publicEnv.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;background:#fbbf24;color:#0b0e14;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">View dashboard</a>
              </p>
            </div>
          </section>
          <p style="padding:16px;color:#64748b;font-size:12px;line-height:1.6;">
            Educational purposes only. Not financial advice. Options trading involves substantial risk and may result in loss of principal. No model output guarantees profitability.
          </p>
        </main>
      </body>
    </html>
  `;
}

export async function sendDailyDigest(scan: ScanResult) {
  if (!serverEnv.RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY missing; email digest skipped.");
    return { sent: 0, skipped: true };
  }

  if (!isSupabaseConfigured) {
    logger.warn("Supabase missing; no digest recipients loaded.");
    return { sent: 0, skipped: true };
  }

  const supabase = createSupabaseAdminClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id,email,subscription_tier,email_digest_enabled")
    .eq("email_digest_enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  const resend = new Resend(serverEnv.RESEND_API_KEY);
  let sent = 0;

  for (const user of users ?? []) {
    const limit = user.subscription_tier === "free" ? 3 : 10;
    const recommendations = scan.recommendations.slice(0, limit);
    if (!recommendations.length) continue;
    const subject = `Figure My Money: ${recommendations.length} options ideas for ${scan.scanDate}`;
    try {
      const response = await resend.emails.send({
        from: resendFrom ?? "Figure My Money <signals@figuremymoney.com>",
        to: user.email,
        subject,
        html: renderDailyDigestEmail(scan, recommendations)
      });
      sent += 1;
      await supabase.from("email_logs").insert({
        user_id: user.id,
        scan_id: scan.scanId ?? null,
        recipient: user.email,
        subject,
        provider_message_id: response.data?.id ?? null,
        status: "sent",
        sent_at: new Date().toISOString()
      });
    } catch (sendError) {
      await supabase.from("email_logs").insert({
        user_id: user.id,
        scan_id: scan.scanId ?? null,
        recipient: user.email,
        subject,
        status: "failed",
        error_message: sendError instanceof Error ? sendError.message : "Unknown Resend error"
      });
    }
  }

  return { sent, skipped: false };
}
