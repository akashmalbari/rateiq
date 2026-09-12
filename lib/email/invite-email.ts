import { Resend } from "resend";
import { resendFrom, serverEnv } from "@/lib/env";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const PREMIUM_INVITE_SUBJECT = "Your Figure My Money invitation";

export function renderPremiumInviteEmail(input: { inviteUrl: string; expiresAt: string }) {
  const expiration = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York"
  }).format(new Date(input.expiresAt));

  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#070a0f;color:#e2e8f0;font-family:Inter,Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;">Your private-launch invitation is ready.</div>
        <main style="max-width:640px;margin:0 auto;padding:32px 16px;">
          <section style="overflow:hidden;border:1px solid #263244;border-radius:16px;background:#111827;">
            <div style="padding:28px;border-bottom:1px solid #263244;background:#151d2d;">
              <p style="margin:0;color:#fbbf24;font-size:12px;letter-spacing:.16em;text-transform:uppercase;">Figure My Money</p>
              <h1 style="margin:12px 0 0;color:#f8fafc;font-size:30px;line-height:1.2;">You&apos;re invited.</h1>
            </div>
            <div style="padding:28px;">
              <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">
                Your request for private-launch access was approved. This invitation unlocks Premium, including the Options Dashboard, Track Record, Paper Portfolio, and Backtests.
              </p>
              <p style="margin:24px 0;">
                <a href="${escapeHtml(input.inviteUrl)}" style="display:inline-block;border-radius:8px;background:#fbbf24;color:#0b0e14;padding:13px 20px;text-decoration:none;font-weight:700;">Activate Premium access</a>
              </p>
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.65;">
                This link can be used once and expires on ${escapeHtml(expiration)}. Do not forward it. The first authenticated account to activate it receives access.
              </p>
            </div>
          </section>
          <p style="padding:14px 6px;color:#64748b;font-size:12px;line-height:1.6;">
            You received this message because this address requested an invitation at Figure My Money.
          </p>
        </main>
      </body>
    </html>
  `;
}

export async function sendPremiumInviteEmail(input: {
  to: string;
  inviteUrl: string;
  expiresAt: string;
}) {
  if (!serverEnv.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required to send invitations.");
  const resend = new Resend(serverEnv.RESEND_API_KEY);
  const response = await resend.emails.send({
    from: resendFrom ?? "Figure My Money <signals@figuremymoney.com>",
    to: input.to,
    subject: PREMIUM_INVITE_SUBJECT,
    html: renderPremiumInviteEmail(input)
  });
  if (response.error) throw new Error(response.error.message);
  return response.data?.id ?? null;
}
