import type { AuthUserRecord, GoogleAccountAuth } from "./db";

export function foundUser(user: AuthUserRecord | null) {
  return user
    ? ({ found: true as const, user })
    : ({ found: false as const, user: null });
}

export function gmailAuthStatus(row: GoogleAccountAuth | null) {
  if (!row?.refreshToken) {
    return {
      authenticated: false as const,
      message:
        "No Google account linked. Open the login URL in your browser to authenticate with Google.",
    };
  }
  if (!row.scope.includes("gmail.readonly")) {
    return {
      authenticated: false as const,
      message: "Google account is linked but missing gmail.readonly scope.",
    };
  }
  return {
    authenticated: true as const,
    message: "Google account is linked with Gmail access. Tools are ready.",
  };
}
