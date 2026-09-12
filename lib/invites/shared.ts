const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export function parseInviteTokenInput(input: string) {
  const value = input.trim();
  let token = value;

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.at(-2) === "invite") token = parts.at(-1) ?? "";
  } catch {
    // A raw token is also accepted.
  }

  return TOKEN_PATTERN.test(token) ? token : null;
}

export function inviteStatus(invite: {
  revoked_at: string | null;
  redeemed_at: string | null;
  expires_at: string;
}, now = new Date()) {
  if (invite.revoked_at) return "revoked" as const;
  if (invite.redeemed_at) return "redeemed" as const;
  if (new Date(invite.expires_at) <= now) return "expired" as const;
  return "available" as const;
}
