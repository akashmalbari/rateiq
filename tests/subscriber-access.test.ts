import { describe, expect, it } from "vitest";
import { getSubscriberAccessState } from "@/lib/admin/subscriber-access";

describe("subscriber access display", () => {
  it("shows an opted-in Essential recipient as an active email subscriber", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: false,
        hasActiveSubscription: false,
        emailDigestEnabled: true,
        profileTier: "essential"
      })
    ).toEqual({
      plan: "essential",
      accessSource: "email_subscriber",
      accessStatus: "active"
    });
  });

  it("keeps an opted-out account without an entitlement inactive", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: false,
        hasActiveSubscription: false,
        emailDigestEnabled: false,
        profileTier: "essential"
      })
    ).toEqual({ plan: "essential", accessSource: "none", accessStatus: "inactive" });
  });

  it("prioritizes invitation access over the profile tier", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: true,
        hasActiveSubscription: false,
        emailDigestEnabled: true,
        profileTier: "essential"
      })
    ).toEqual({ plan: "premium", accessSource: "invitation", accessStatus: "invite" });
  });
});
