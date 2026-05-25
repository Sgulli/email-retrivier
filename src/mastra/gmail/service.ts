import { Context, Effect, Layer, Either } from "effect";
import { GmailApiError } from "../lib/errors";
import type {
  GmailMessage,
  FetchMessagesOptions,
  FetchMessagesResult,
} from "../types";
import {
  FIELDS_MESSAGE,
  FIELDS_MESSAGE_LIST_IDS,
  FIELDS_LABELS,
} from "../lib/consts";
import { toGmailMessage, callAPI, must } from "../lib/utils";
import { GmailClient } from "./client";

export class GmailService extends Context.Tag("GmailService")<
  GmailService,
  {
    readonly fetchLabels: Effect.Effect<string[], GmailApiError>;
    readonly fetchAllLabels: Effect.Effect<Map<string, string>, GmailApiError>;
    readonly fetchMessages: (
      opts: FetchMessagesOptions,
    ) => Effect.Effect<FetchMessagesResult, GmailApiError>;
    readonly fetchMessage: (
      id: string,
    ) => Effect.Effect<GmailMessage, GmailApiError>;
  }
>() {
  static readonly Live = Layer.effect(
    GmailService,
    Effect.gen(function* () {
      const gmail = yield* GmailClient;

      const listLabels = callAPI(() =>
        gmail.users.labels.list({ userId: "me", fields: FIELDS_LABELS }),
      ).pipe(Effect.map((res) => res.data.labels ?? []));

      const fetchLabels = listLabels.pipe(
        Effect.map((labels) =>
          labels
            .map((l) => l.name)
            .filter((n): n is string => typeof n === "string"),
        ),
      );

      const fetchAllLabels = listLabels.pipe(
        Effect.map((labels) => {
          const map = new Map<string, string>();
          for (const label of labels) {
            if (label.id && label.name) map.set(label.id, label.name);
          }
          return map;
        }),
      );

      const fetchMessages = (opts: FetchMessagesOptions = {}) =>
        Effect.gen(function* () {
          const { maxResults = 20, pageToken, query, labelIds } = opts;
          yield* must(
            maxResults >= 1 && maxResults <= 500,
            "maxResults must be between 1 and 500",
          );

          const listRes = yield* callAPI(() =>
            gmail.users.messages.list({
              userId: "me",
              maxResults,
              pageToken,
              q: query,
              labelIds,
              fields: FIELDS_MESSAGE_LIST_IDS,
            }),
          );

          const stubs = listRes.data.messages ?? [];
          if (stubs.length === 0) {
            return {
              messages: [],
              nextPageToken: listRes.data.nextPageToken ?? undefined,
              resultSizeEstimate: 0,
            };
          }

          const ids = stubs.filter(
            (m): m is { id: string } => typeof m.id === "string",
          );

          const outcomes = yield* Effect.forEach(
            ids,
            (msg) =>
              callAPI(() =>
                gmail.users.messages.get({
                  userId: "me",
                  id: msg.id,
                  format: "metadata",
                  metadataHeaders: ["Subject", "From"],
                  fields: FIELDS_MESSAGE,
                }),
              ).pipe(
                Effect.flatMap((res) => toGmailMessage(res.data)),
                Effect.either,
              ),
            { concurrency: 10 },
          );

          const messages: GmailMessage[] = [];
          for (const outcome of outcomes) {
            if (Either.isRight(outcome)) {
              messages.push(outcome.right);
            } else {
              yield* Effect.logError(
                "Failed to fetch message detail",
                outcome.left,
              );
            }
          }

          return {
            messages,
            nextPageToken: listRes.data.nextPageToken ?? undefined,
            resultSizeEstimate:
              listRes.data.resultSizeEstimate ?? messages.length,
          };
        });

      const fetchMessage = (id: string) =>
        Effect.gen(function* () {
          yield* must(!!id, "Message ID is required");
          const res = yield* callAPI(() =>
            gmail.users.messages.get({
              userId: "me",
              id,
              format: "metadata",
              metadataHeaders: ["Subject", "From"],
              fields: FIELDS_MESSAGE,
            }),
          );
          return yield* toGmailMessage(res.data);
        });

      return {
        fetchLabels,
        fetchAllLabels,
        fetchMessages,
        fetchMessage,
      } as const;
    }),
  );
}
