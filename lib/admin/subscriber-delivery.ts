export type SubscriberDeliveryState =
  | "sent"
  | "queued"
  | "failed"
  | "skipped"
  | "missing"
  | "opted_out"
  | "no_access"
  | "not_due";

export function getSubscriberDeliveryState(input: {
  emailDigestEnabled: boolean;
  deliveryEligible: boolean;
  accountCreatedAt: string;
  latestScanStartedAt: string | null;
  latestScanLogStatus: "queued" | "sent" | "failed" | "skipped" | null;
}): SubscriberDeliveryState {
  if (!input.emailDigestEnabled) return "opted_out";
  if (!input.deliveryEligible) return "no_access";
  if (
    !input.latestScanStartedAt ||
    new Date(input.accountCreatedAt).getTime() > new Date(input.latestScanStartedAt).getTime()
  ) {
    return "not_due";
  }
  if (input.latestScanLogStatus) return input.latestScanLogStatus;
  return "missing";
}
