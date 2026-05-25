import { Context, Effect, Layer } from "effect";
import type { gmail_v1 } from "googleapis";
import { GmailAuth } from "./auth";

export class GmailClient extends Context.Tag("GmailClient")<
  GmailClient,
  gmail_v1.Gmail
>() {
  static readonly Live = (userId: string) =>
    Layer.effect(
      GmailClient,
      Effect.gen(function* () {
        const auth = yield* GmailAuth;
        return yield* auth.getClient(userId);
      }),
    );
}
