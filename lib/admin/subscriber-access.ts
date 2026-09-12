export type SubscriberPlan = "essential" | "premium" | "enterprise";

type SubscriberAccessInput = {
  isAdmin: boolean;
  hasInviteAccess: boolean;
  hasActiveSubscription: boolean;
  emailDigestEnabled: boolean;
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
  if (input.hasInviteAccess) {
    return { plan, accessSource: "invitation", accessStatus: "invite" };
  }
  if (input.hasActiveSubscription) {
    return {
      plan,
      accessSource: "subscription",
      accessStatus: input.subscriptionStatus ?? "active"
    };
  }
  if (input.emailDigestEnabled) {
    return { plan, accessSource: "email_subscriber", accessStatus: "active" };
  }

  return {
    plan,
    accessSource: "none",
    accessStatus: input.subscriptionStatus ?? "inactive"
  };
}
