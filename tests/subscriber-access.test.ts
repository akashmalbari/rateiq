import { describe, expect, it } from "vitest";
import { getSubscriberAccessState } from "@/lib/admin/subscriber-access";

describe("subscriber access display", () => {
  it("shows an Essential account as active independently of email preference", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: false,
        hasAdminGrantAccess: false,
        hasActiveSubscription: false,
        accountIsActive: true,
        profileTier: "essential"
      })
    ).toEqual({
      plan: "essential",
      accessSource: "essential_access",
      accessStatus: "active"
    });
  });

  it("keeps an opted-out account without an entitlement inactive", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: false,
        hasAdminGrantAccess: false,
        hasActiveSubscription: false,
        accountIsActive: false,
        profileTier: "essential"
      })
    ).toEqual({ plan: "essential", accessSource: "none", accessStatus: "inactive" });
  });

  it("prioritizes invitation access over the profile tier", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: true,
        hasAdminGrantAccess: false,
        hasActiveSubscription: false,
        accountIsActive: true,
        profileTier: "essential"
      })
    ).toEqual({ plan: "premium", accessSource: "invitation", accessStatus: "invite" });
  });

  it("shows a direct administrator Premium grant without calling it a subscription", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: false,
        hasAdminGrantAccess: true,
        hasActiveSubscription: false,
        accountIsActive: true,
        profileTier: "premium"
      })
    ).toEqual({ plan: "premium", accessSource: "admin_grant", accessStatus: "active" });
  });

  it("lets account deactivation override an invitation", () => {
    expect(
      getSubscriberAccessState({
        isAdmin: false,
        hasInviteAccess: true,
        hasAdminGrantAccess: false,
        hasActiveSubscription: false,
        accountIsActive: false,
        profileTier: "premium"
      })
    ).toEqual({ plan: "premium", accessSource: "none", accessStatus: "inactive" });
  });
});
