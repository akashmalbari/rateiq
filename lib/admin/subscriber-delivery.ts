export type SubscriberDeliveryState =
  | "sent"
  | "queued"
  | "failed"
  | "skipped"
  | "missing"
  | "opted_out"
  | "not_due";

export function getSubscriberDeliveryState(input: {
  emailDigestEnabled: boolean;
  accountCreatedAt: string;
  latestScanStartedAt: string | null;
  latestScanLogStatus: "queued" | "sent" | "failed" | "skipped" | null;
}): SubscriberDeliveryState {
  if (!input.emailDigestEnabled) return "opted_out";
  if (
    !input.latestScanStartedAt ||
    new Date(input.accountCreatedAt).getTime() > new Date(input.latestScanStartedAt).getTime()
  ) {
    return "not_due";
  }
  if (input.latestScanLogStatus) return input.latestScanLogStatus;
  return "missing";
}
