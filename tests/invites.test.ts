import { describe, expect, it } from "vitest";
import { inviteStatus, parseInviteTokenInput } from "@/lib/invites/shared";
import { createInviteToken, hashInviteToken } from "@/lib/invites/tokens";

describe("premium invitations", () => {
  it("creates opaque tokens and stores a deterministic hash", () => {
    const first = createInviteToken();
    const second = createInviteToken();

    expect(first).not.toBe(second);
    expect(first).toHaveLength(43);
    expect(hashInviteToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInviteToken(first)).toBe(hashInviteToken(first));
  });

  it("accepts a raw token or full invite URL", () => {
    const token = createInviteToken();
    expect(parseInviteTokenInput(token)).toBe(token);
    expect(parseInviteTokenInput(`https://figuremymoney.com/invite/${token}`)).toBe(token);
    expect(parseInviteTokenInput("not-an-invite" )).toBeNull();
  });

  it("reports lifecycle status in enforcement order", () => {
    const future = new Date("2030-01-01T00:00:00.000Z").toISOString();
    const past = new Date("2020-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:00:00.000Z");

    expect(inviteStatus({ revoked_at: null, redeemed_at: null, expires_at: future }, now)).toBe("available");
    expect(inviteStatus({ revoked_at: null, redeemed_at: null, expires_at: past }, now)).toBe("expired");
    expect(inviteStatus({ revoked_at: null, redeemed_at: now.toISOString(), expires_at: past }, now)).toBe("redeemed");
    expect(inviteStatus({ revoked_at: now.toISOString(), redeemed_at: now.toISOString(), expires_at: future }, now)).toBe("revoked");
  });
});
