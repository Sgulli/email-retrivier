import { Context, Effect, Layer } from "effect";
import { FileSystem } from "@effect/platform/FileSystem";
import { Path } from "@effect/platform/Path";
import { GmailApiError } from "../lib/errors";
import type { AttachmentMeta, DownloadResult } from "../types";
import {
  decodeBase64Url,
  sanitizeFilename,
  collectAttachments,
  callAPI,
  must,
  isEEXIST,
} from "../lib/utils";
import { GmailClient } from "./client";
import { FIELDS_FULL_MESSAGE, DEFAULT_SKIP_MIMES } from "../lib/consts";

export class AttachmentService extends Context.Tag("AttachmentService")<
  AttachmentService,
  {
    readonly listAttachments: (
      messageId: string,
    ) => Effect.Effect<AttachmentMeta[], GmailApiError>;
    readonly fetchAttachment: (
      messageId: string,
      attachmentId: string,
    ) => Effect.Effect<Buffer, GmailApiError>;
    readonly saveAttachment: (
      buffer: Buffer,
      filename: string,
      outDir: string,
    ) => Effect.Effect<string, GmailApiError>;
    readonly downloadAllAttachments: (
      messageId: string,
      outDir: string,
    ) => Effect.Effect<DownloadResult[], GmailApiError>;
  }
>() {
  static readonly Live = Layer.effect(
    AttachmentService,
    Effect.gen(function* () {
      const gmail = yield* GmailClient;
      const fs = yield* FileSystem;
      const p = yield* Path;

      const listAttachments = (messageId: string) =>
        Effect.gen(function* () {
          yield* must(!!messageId, "Message ID is required");
          const res = yield* callAPI(() =>
            gmail.users.messages.get({
              userId: "me",
              id: messageId,
              format: "full",
              fields: FIELDS_FULL_MESSAGE,
            }),
          );
          if (!res.data.payload) return [];
          return collectAttachments(
            res.data.payload,
            false,
            undefined,
            DEFAULT_SKIP_MIMES,
          );
        });

      const fetchAttachment = (messageId: string, attachmentId: string) =>
        Effect.gen(function* () {
          yield* must(
            !!messageId && !!attachmentId,
            "Message ID and attachment ID required",
          );
          const res = yield* callAPI(() =>
            gmail.users.messages.attachments.get({
              userId: "me",
              messageId,
              id: attachmentId,
            }),
          );
          yield* must(
            !!res.data.data,
            `No data for attachment ${attachmentId}`,
          );
          return decodeBase64Url(res.data.data!);
        });

      const saveAttachment = (
        buffer: Buffer,
        filename: string,
        outDir: string,
      ) =>
        Effect.gen(function* () {
          yield* fs.makeDirectory(outDir, { recursive: true }).pipe(
            Effect.mapError(
              (cause) =>
                new GmailApiError({
                  message: "Failed to create directory",
                  cause,
                }),
            ),
          );

          const candidate = sanitizeFilename(filename) || "unnamed_attachment";
          const ext = p.extname(candidate);
          const base = p.basename(candidate, ext);

          const attempt = (
            counter: number,
          ): Effect.Effect<string, GmailApiError> =>
            Effect.gen(function* () {
              const dest =
                counter === 0
                  ? p.join(outDir, candidate)
                  : p.join(outDir, `${base} (${counter})${ext}`);
              return yield* fs
                .writeFile(dest, new Uint8Array(buffer), { flag: "wx" })
                .pipe(
                  Effect.map(() => dest),
                  Effect.catchAll((err) =>
                    isEEXIST(err)
                      ? attempt(counter + 1)
                      : Effect.fail(
                          new GmailApiError({
                            message: `Failed to write ${dest}`,
                            cause: err,
                          }),
                        ),
                  ),
                );
            });

          return yield* attempt(0);
        });

      const downloadAllAttachments = (messageId: string, outDir: string) =>
        Effect.gen(function* () {
          const metas = yield* listAttachments(messageId);
          if (metas.length === 0) {
            yield* Effect.logInfo(`No attachments for message ${messageId}`);
            return [];
          }
          yield* Effect.logInfo(
            `Found ${metas.length} attachment(s) in message ${messageId}`,
          );

          const results: DownloadResult[] = [];
          yield* Effect.forEach(
            metas,
            (meta) =>
              Effect.gen(function* () {
                const buffer = yield* fetchAttachment(
                  messageId,
                  meta.attachmentId,
                );
                const savedPath = yield* saveAttachment(
                  buffer,
                  meta.filename,
                  outDir,
                );
                results.push({
                  attachmentId: meta.attachmentId,
                  filename: meta.filename,
                  savedPath,
                  size: buffer.length,
                });
                yield* Effect.logInfo(`Saved: ${meta.filename} → ${savedPath}`);
              }).pipe(
                Effect.catchAll((err) =>
                  Effect.logError(`Failed: ${meta.filename}`, err),
                ),
              ),
            { concurrency: 1 },
          );

          return results;
        });

      return {
        listAttachments,
        fetchAttachment,
        saveAttachment,
        downloadAllAttachments,
      } as const;
    }),
  );
}
