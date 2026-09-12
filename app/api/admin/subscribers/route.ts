import { NextResponse } from "next/server";
import { getSubscriberDeliveryState } from "@/lib/admin/subscriber-delivery";
import { requireAdmin } from "@/lib/auth/authorization";
import { subscriptionIsActive } from "@/lib/billing/service";
import { adminEmails, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_SUBSCRIBERS = 500;
const MAX_EMAIL_LOGS = 5000;

type EmailLogSummary = {
  user_id: string | null;
  scan_id: string | null;
  status: "queued" | "sent" | "failed" | "skipped";
  subject: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export async function GET() {
  try {
    await requireAdmin();
    if (!isSupabaseConfigured) {
      return NextResponse.json({ subscribers: [], latestScan: null });
    }

    const supabase = createSupabaseAdminClient();
    const [usersResult, subscriptionsResult, invitesResult, emailLogsResult, scanResult] =
      await Promise.all([
        supabase
          .from("users")
          .select("id,email,full_name,role,subscription_tier,email_digest_enabled,created_at")
          .order("created_at", { ascending: false })
          .limit(MAX_SUBSCRIBERS),
        supabase.from("subscriptions").select("user_id,tier,status,current_period_end"),
        supabase
          .from("premium_invites")
          .select("redeemed_by,redeemed_at,revoked_at")
          .not("redeemed_at", "is", null)
          .is("revoked_at", null),
        supabase
          .from("email_logs")
          .select("user_id,scan_id,status,subject,error_message,sent_at,created_at")
          .order("created_at", { ascending: false })
          .limit(MAX_EMAIL_LOGS),
        supabase
          .from("scans")
          .select("id,scan_date,started_at")
          .eq("status", "completed")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

    const queryError =
      usersResult.error ??
      subscriptionsResult.error ??
      invitesResult.error ??
      emailLogsResult.error ??
      scanResult.error;
    if (queryError) throw new Error(queryError.message);

    const subscriptionByUser = new Map(
      (subscriptionsResult.data ?? []).map((subscription) => [subscription.user_id, subscription])
    );
    const invitedUserIds = new Set(
      (invitesResult.data ?? []).flatMap((invite) =>
        invite.redeemed_by ? [invite.redeemed_by] : []
      )
    );
    const latestLogByUser = new Map<string, EmailLogSummary>();
    const latestSentAtByUser = new Map<string, string>();
    const latestScanLogByUser = new Map<string, EmailLogSummary>();
    const latestScan = scanResult.data;

    for (const log of emailLogsResult.data ?? []) {
      if (!log.user_id) continue;
      if (!latestLogByUser.has(log.user_id)) latestLogByUser.set(log.user_id, log);
      if (log.status === "sent" && !latestSentAtByUser.has(log.user_id)) {
        latestSentAtByUser.set(log.user_id, log.sent_at ?? log.created_at);
      }
      if (latestScan && log.scan_id === latestScan.id && !latestScanLogByUser.has(log.user_id)) {
        latestScanLogByUser.set(log.user_id, log);
      }
    }

    const subscribers = (usersResult.data ?? []).map((user) => {
      const subscription = subscriptionByUser.get(user.id);
      const isAdmin = user.role === "admin" || adminEmails.includes(user.email.toLowerCase());
      const hasInviteAccess = invitedUserIds.has(user.id);
      const hasActiveSubscription = subscriptionIsActive(subscription?.status);
      const deliveryEligible = isAdmin || hasInviteAccess || hasActiveSubscription;
      const latestLog = latestLogByUser.get(user.id) ?? null;
      const latestScanLog = latestScanLogByUser.get(user.id) ?? null;
      const plan = isAdmin
        ? "premium"
        : hasInviteAccess
          ? "premium"
          : subscription?.tier ?? user.subscription_tier ?? "essential";
      const accessSource = isAdmin
        ? "administrator"
        : hasInviteAccess
          ? "invitation"
          : hasActiveSubscription
            ? "subscription"
            : "none";

      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
        plan,
        accessSource,
        billingStatus: isAdmin
          ? "admin"
          : hasInviteAccess
            ? "invite"
            : subscription?.status ?? "inactive",
        currentPeriodEnd: subscription?.current_period_end ?? null,
        emailDigestEnabled: user.email_digest_enabled,
        deliveryEligible,
        latestDeliveryState: getSubscriberDeliveryState({
          emailDigestEnabled: user.email_digest_enabled,
          deliveryEligible,
          accountCreatedAt: user.created_at,
          latestScanStartedAt: latestScan?.started_at ?? null,
          latestScanLogStatus: latestScanLog?.status ?? null
        }),
        lastSentAt: latestSentAtByUser.get(user.id) ?? null,
        lastAttempt: latestLog
          ? {
              status: latestLog.status,
              createdAt: latestLog.created_at,
              subject: latestLog.subject,
              error: latestLog.error_message
            }
          : null
      };
    });

    return NextResponse.json({ subscribers, latestScan: latestScan ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Subscribers could not be loaded." },
      { status: 403 }
    );
  }
}
