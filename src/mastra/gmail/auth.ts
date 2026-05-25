import { Context, Effect, Layer } from "effect";
import { google } from "googleapis";
import { DbService } from "../lib/db";
import { AuthError } from "../lib/errors";

export class GmailAuth extends Context.Tag("GmailAuth")<
  GmailAuth,
  {
    readonly getClient: (userId: string) => Effect.Effect<
      ReturnType<typeof google.gmail>,
      AuthError
    >;
  }
>() {
  static readonly Live = Layer.effect(
    GmailAuth,
    Effect.gen(function* () {
      const db = yield* DbService;

      const getClient = (userId: string) =>
        Effect.gen(function* () {
          const refreshToken = yield* db.getRefreshToken(userId).pipe(
            Effect.mapError(
              () =>
                new AuthError({
                  message: "Failed to read refresh token from database",
                }),
            ),
          );

          if (!refreshToken) {
            return yield* Effect.fail(
              new AuthError({
                message:
                  "No Google account linked. Sign in with Google first.",
              }),
            );
          }

          const oauth2 = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
          );

          oauth2.setCredentials({ refresh_token: refreshToken });

          return google.gmail({ version: "v1", auth: oauth2 });
        });

      return { getClient } as const;
    }),
  );
}
