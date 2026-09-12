import { describe, expect, it } from "vitest";
import { PREMIUM_INVITE_SUBJECT, renderPremiumInviteEmail } from "@/lib/email/invite-email";

describe("premium invitation email", () => {
  it("renders a single-use activation link and expiration", () => {
    const html = renderPremiumInviteEmail({
      inviteUrl: "https://figuremymoney.com/invite/secure-token",
      expiresAt: "2026-10-12T16:00:00.000Z"
    });

    expect(PREMIUM_INVITE_SUBJECT).toBe("Your Figure My Money invitation");
    expect(html).toContain("https://figuremymoney.com/invite/secure-token");
    expect(html).toContain("October 12, 2026");
    expect(html).toContain("This link can be used once");
    expect(html).toContain("Activate Premium access");
  });

  it("escapes an unsafe URL before placing it in the email", () => {
    const html = renderPremiumInviteEmail({
      inviteUrl: "https://example.com/?next=\"bad\"&mode=test",
      expiresAt: "2026-10-12T16:00:00.000Z"
    });

    expect(html).toContain("&quot;bad&quot;&amp;mode=test");
    expect(html).not.toContain('next="bad"');
  });
});
