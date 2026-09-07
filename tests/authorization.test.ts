import { describe, expect, it } from "vitest";
import { profileHasPremiumAccess } from "@/lib/auth/authorization";

describe("subscription authorization", () => {
  it("keeps Essential accounts email-only", () => {
    expect(
      profileHasPremiumAccess({ role: "user", subscription_tier: "essential" })
    ).toBe(false);
  });

  it("allows Premium accounts into the research workspace", () => {
    expect(
      profileHasPremiumAccess({ role: "user", subscription_tier: "premium" })
    ).toBe(true);
  });

  it("always grants administrators Premium access", () => {
    expect(
      profileHasPremiumAccess({ role: "admin", subscription_tier: "essential" })
    ).toBe(true);
  });
});
