export async function getAuth(): Promise<ReturnType<typeof betterAuth>> {
  const { betterAuth } = await import("better-auth");
  const { getMigrations } = await import("better-auth/db/migration");
  const { DatabaseSync } = await import("node:sqlite");

  const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const dbPath =
    process.env.DATABASE_URL?.replace("file:", "") || "./data/mastra.db";

  const authConfig = {
    baseURL,
    database: new DatabaseSync(dbPath),
    emailAndPassword: { enabled: true },
    account: { skipStateCookieCheck: true },
    socialProviders: {
      google: {
        enabled: true,
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirectUri: `${baseURL}/api/auth/callback/google`,
        accessType: "offline" as const,
        prompt: "select_account consent" as const,
      },
    },
    trustedOrigins: ["http://localhost:3000"],
  };

  const auth = betterAuth(
    authConfig as unknown as Parameters<typeof betterAuth>[0],
  );

  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(
    authConfig as unknown as Parameters<typeof getMigrations>[0],
  );
  if (toBeCreated.length > 0 || toBeAdded.length > 0) {
    console.log("[Auth] Running Better Auth migrations...");
    await runMigrations();
    console.log("[Auth] Migrations completed");
  }

  return auth;
}
