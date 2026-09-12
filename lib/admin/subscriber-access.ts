export type SubscriberPlan = "essential" | "premium" | "enterprise";

type SubscriberAccessInput = {
  isAdmin: boolean;
  hasInviteAccess: boolean;
  hasAdminGrantAccess: boolean;
  hasActiveSubscription: boolean;
  accountIsActive: boolean;
  subscriptionTier?: SubscriberPlan | null;
  profileTier?: SubscriberPlan | null;
  subscriptionStatus?: string | null;
};

export function getSubscriberAccessState(input: SubscriberAccessInput) {
  const plan: SubscriberPlan = input.isAdmin || input.hasInviteAccess
    ? "premium"
    : input.subscriptionTier ?? input.profileTier ?? "essential";

  if (input.isAdmin) {
    return { plan, accessSource: "administrator", accessStatus: "admin" };
  }
  if (!input.accountIsActive) {
    return { plan, accessSource: "none", accessStatus: "inactive" };
  }
  if (input.hasInviteAccess) {
    return { plan, accessSource: "invitation", accessStatus: "invite" };
  }
  if (input.hasAdminGrantAccess) {
    return { plan: "premium" as const, accessSource: "admin_grant", accessStatus: "active" };
  }
  if (input.hasActiveSubscription) {
    return {
      plan,
      accessSource: "subscription",
      accessStatus: input.subscriptionStatus ?? "active"
    };
  }
  return { plan, accessSource: "essential_access", accessStatus: "active" };
}
