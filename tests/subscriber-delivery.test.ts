import { describe, expect, it } from "vitest";
import { getSubscriberDeliveryState } from "@/lib/admin/subscriber-delivery";

const base = {
  emailDigestEnabled: true,
  accountCreatedAt: "2026-09-01T12:00:00.000Z",
  latestScanStartedAt: "2026-09-11T14:30:00.000Z",
  latestScanLogStatus: null
} as const;

describe("subscriber delivery state", () => {
  it("suppresses delivery reporting when account access is inactive", () => {
    expect(
      getSubscriberDeliveryState({
        ...base,
        accountIsActive: false,
      })
    ).toBe("suppressed");
  });

  it("reports a subscriber who disabled the daily email as opted out", () => {
    expect(getSubscriberDeliveryState({ ...base, emailDigestEnabled: false })).toBe("opted_out");
  });

  it("reports an eligible subscriber with no latest-scan log as missing", () => {
    expect(getSubscriberDeliveryState(base)).toBe("missing");
  });

  it("uses the recorded delivery result when an attempt exists", () => {
    expect(getSubscriberDeliveryState({ ...base, latestScanLogStatus: "sent" })).toBe("sent");
    expect(getSubscriberDeliveryState({ ...base, latestScanLogStatus: "failed" })).toBe("failed");
  });

  it("does not flag accounts created after the scan", () => {
    expect(
      getSubscriberDeliveryState({ ...base, accountCreatedAt: "2026-09-12T12:00:00.000Z" })
    ).toBe("not_due");
  });
});
