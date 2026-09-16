import { Resend } from "resend";
import { isSupabaseConfigured, publicEnv, resendFrom, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recommendationAnnualizedYield } from "@/lib/trading/annualized-yield";
import type { Recommendation, ScanResult } from "@/lib/trading/types";

const DIGEST_BODY_LIMIT = 10;
const DIGEST_SUBJECT_LIMIT = 3;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

function recommendationCredit(recommendation: Recommendation) {
  return (
    recommendation.optionLegs.reduce(
      (total, leg) => total + (leg.action === "sell" ? leg.mid : -leg.mid),
      0
    ) * 100
  );
}

export function digestSubject(scanDate: string, recommendations: Recommendation[]) {
  const symbols = recommendations
    .slice(0, DIGEST_SUBJECT_LIMIT)
    .map((recommendation) => recommendation.symbol)
    .join(", ");
  return `Figure My Money: ${symbols} | ${scanDate}`;
}

export function selectDigestRecommendations(
  recommendations: Recommendation[],
  limit: number
) {
  const selected: Recommendation[] = [];
  const selectedSymbols = new Set<string>();
  const selectedKeys = new Set<string>();
  const incomeStrategies = ["cash_secured_put", "covered_call"] as const;
  const rankedIncome = recommendations.filter((recommendation) =>
    incomeStrategies.includes(
      recommendation.strategyType as (typeof incomeStrategies)[number]
    )
  );
  const leadingStrategy = rankedIncome[0]?.strategyType;
  const strategyOrder = leadingStrategy === "covered_call"
    ? (["covered_call", "cash_secured_put"] as const)
    : incomeStrategies;
  const targetByStrategy = new Map<string, number>([
    [strategyOrder[0], Math.ceil(limit / 2)],
    [strategyOrder[1], Math.floor(limit / 2)]
  ]);
  const strategyCounts = new Map<string, number>();

  const add = (recommendation: Recommendation | undefined, allowRepeatedSymbol = false) => {
    if (!recommendation || selected.length >= limit) return false;
    const key = `${recommendation.strategyType}:${recommendation.symbol}`;
    if (selectedKeys.has(key) || (!allowRepeatedSymbol && selectedSymbols.has(recommendation.symbol))) {
      return false;
    }
    selected.push(recommendation);
    selectedSymbols.add(recommendation.symbol);
    selectedKeys.add(key);
    strategyCounts.set(
      recommendation.strategyType,
      (strategyCounts.get(recommendation.strategyType) ?? 0) + 1
    );
    return true;
  };

  // Alternate the two income strategies and reserve half of the digest for each.
  // This prevents one side from claiming every symbol when the scan ranks a call
  // and a put for the same underlying next to each other.
  while (selected.length < limit) {
    let added = false;
    for (const strategy of strategyOrder) {
      const target = targetByStrategy.get(strategy) ?? 0;
      if ((strategyCounts.get(strategy) ?? 0) >= target) continue;
      const candidate = rankedIncome.find(
        (recommendation) =>
          recommendation.strategyType === strategy &&
          !selectedKeys.has(`${recommendation.strategyType}:${recommendation.symbol}`) &&
          !selectedSymbols.has(recommendation.symbol)
      );
      added = add(candidate) || added;
    }
    if (!added) break;
  }

  // If both strategies qualify on the same ticker, complete the strategy quota
  // before using unrestricted fallback slots.
  while (selected.length < limit) {
    let added = false;
    for (const strategy of strategyOrder) {
      const target = targetByStrategy.get(strategy) ?? 0;
      if ((strategyCounts.get(strategy) ?? 0) >= target) continue;
      const candidate = rankedIncome.find(
        (recommendation) =>
          recommendation.strategyType === strategy &&
          !selectedKeys.has(`${recommendation.strategyType}:${recommendation.symbol}`)
      );
      added = add(candidate, true) || added;
    }
    if (!added) break;
  }

  // Prefer ticker diversity, then allow the other strategy on the same ticker
  // only when needed to fill the ten ranked ideas.
  recommendations.forEach((recommendation) => add(recommendation));
  recommendations.forEach((recommendation) => add(recommendation, true));

  return selected.slice(0, limit);
}

export function renderDailyDigestEmail(
  scan: ScanResult,
  recommendations: Recommendation[]
) {
  const cards = recommendations
    .map(
      (rec, index) => {
        const annualizedYield = recommendationAnnualizedYield(rec)?.annualizedYieldPct;
        return `
          <section style="margin-bottom:14px;padding:20px;background:#0b1220;border:1px solid #223041;border-radius:12px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                <td>
                  <div style="color:#64748b;font-size:11px;letter-spacing:.12em;text-transform:uppercase;">#${index + 1} &middot; ${escapeHtml(rec.strategyName)}</div>
                  <strong style="display:block;margin-top:7px;font-size:22px;color:#f8fafc;">${escapeHtml(rec.symbol)}</strong>
                  <div style="color:#94a3b8;font-size:12px;">${escapeHtml(rec.companyName)}</div>
                </td>
                <td align="right" style="color:#86efac;font-size:14px;">
                  ${rec.probabilityOfProfit.toFixed(1)}% POP
                  <div style="margin-top:6px;color:#fbbf24;">${rec.confidenceScore} confidence</div>
                </td>
              </tr>
            </table>
            <table role="presentation" style="width:100%;margin-top:18px;border-collapse:separate;border-spacing:6px;">
              <tr>
                <td style="padding:12px;background:#111827;border-radius:8px;color:#94a3b8;font-size:11px;text-transform:uppercase;">Stock price<br><strong style="display:block;margin-top:5px;color:#f8fafc;font-size:16px;">${currency(rec.underlyingPrice)}</strong></td>
                <td style="padding:12px;background:#111827;border-radius:8px;color:#94a3b8;font-size:11px;text-transform:uppercase;">Expiration<br><strong style="display:block;margin-top:5px;color:#f8fafc;font-size:16px;">${escapeHtml(rec.expirationDate)}</strong></td>
                <td style="padding:12px;background:#111827;border-radius:8px;color:#94a3b8;font-size:11px;text-transform:uppercase;">Strike<br><strong style="display:block;margin-top:5px;color:#f8fafc;font-size:16px;">${currency(rec.strikePrice)}</strong></td>
              </tr>
              <tr>
                <td style="padding:12px;background:#102821;border-radius:8px;color:#86efac;font-size:11px;text-transform:uppercase;">Credit<br><strong style="display:block;margin-top:5px;font-size:16px;">${currency(recommendationCredit(rec))}</strong></td>
                <td style="padding:12px;background:#2b2614;border-radius:8px;color:#fde68a;font-size:11px;text-transform:uppercase;">APY<br><strong style="display:block;margin-top:5px;font-size:16px;">${annualizedYield == null ? "N/A" : `${annualizedYield.toFixed(1)}%`}</strong></td>
                <td style="padding:12px;background:#111827;border-radius:8px;color:#94a3b8;font-size:11px;text-transform:uppercase;">Delta<br><strong style="display:block;margin-top:5px;color:#f8fafc;font-size:16px;">${Math.abs(rec.greeks.delta).toFixed(3)}</strong></td>
              </tr>
            </table>
            <p style="margin:14px 0 0;color:#cbd5e1;font-size:13px;line-height:1.55;">${escapeHtml(rec.entryRecommendation)}</p>
          </section>`;
      }
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
        <div style="display:none;max-height:0;overflow:hidden;">Fresh contracts from today's scan, with strike, expiration, credit, and annualized yield.</div>
        <main style="max-width:760px;margin:0 auto;padding:32px 16px;">
          <section style="background:#111827;border:1px solid #223041;border-radius:18px;overflow:hidden;">
            <div style="padding:30px;background:linear-gradient(135deg,#111827,#172033);border-bottom:1px solid #223041;">
              <p style="margin:0 0 10px;color:#fbbf24;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Figure My Money Daily Quant Scan</p>
              <h1 style="margin:0;color:#f8fafc;font-size:30px;line-height:1.15;">Today's ranked options setups</h1>
              <p style="margin:14px 0 0;color:#94a3b8;line-height:1.6;">
                ${scan.marketRegime.label.replaceAll("_", " ")} regime, ${scan.marketRegime.vixLevel.toFixed(1)} VIX proxy, ${scan.marketRegime.breadth}% breadth.
              </p>
            </div>
            <div style="padding:24px;">
              ${cards}
              <h2 style="color:#f8fafc;font-size:18px;margin:28px 0 12px;">Model reasoning</h2>
              <ul style="margin:0;padding-left:20px;color:#cbd5e1;line-height:1.6;">${topReasons}</ul>
              <p style="margin:28px 0 0;color:#94a3b8;line-height:1.6;">
                Sign in to Figure My Money to manage your account and access the research tools included with your plan.
              </p>
              <p style="margin:18px 0 0;">
                <a href="${publicEnv.NEXT_PUBLIC_APP_URL}/login" style="display:inline-block;background:#fbbf24;color:#0b0e14;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">Open Figure My Money</a>
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

export function shouldReceiveDailyDigest(user: {
  email_digest_enabled: boolean;
  access_status?: "active" | "inactive";
}) {
  return user.email_digest_enabled && user.access_status !== "inactive";
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
  const { data: profiles, error } = await supabase
    .from("users")
    .select("id,email,email_digest_enabled,access_status");

  if (error) {
    throw new Error(error.message);
  }

  // Billing controls product access; this explicit preference alone controls email delivery.
  const users = (profiles ?? []).filter(shouldReceiveDailyDigest);

  const resend = new Resend(serverEnv.RESEND_API_KEY);
  const recommendations = selectDigestRecommendations(
    scan.recommendations,
    DIGEST_BODY_LIMIT
  );
  if (!recommendations.length) {
    return { sent: 0, skipped: true, duplicateSkips: 0 };
  }
  const subject = digestSubject(scan.scanDate, recommendations);
  let sent = 0;
  let duplicateSkips = 0;

  for (const user of users) {
    if (scan.scanId) {
      const { data: existingDelivery, error: existingDeliveryError } = await supabase
        .from("email_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("scan_id", scan.scanId)
        .eq("status", "sent")
        .limit(1)
        .maybeSingle();
      if (existingDeliveryError) {
        logger.warn("Digest duplicate check failed", {
          userId: user.id,
          error: existingDeliveryError.message
        });
      } else if (existingDelivery) {
        duplicateSkips += 1;
        continue;
      }
    }

    try {
      const response = await resend.emails.send({
        from: resendFrom ?? "Figure My Money <signals@figuremymoney.com>",
        to: user.email,
        subject,
        html: renderDailyDigestEmail(scan, recommendations)
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
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

  return { sent, skipped: false, duplicateSkips };
}
