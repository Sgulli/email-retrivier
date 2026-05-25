import { resolve, dirname as pathDirname } from "node:path";
import { Effect, Schedule } from "effect";
import type { gmail_v1 } from "googleapis";
import { decodeHtmlEntities } from "@/lib/decode-html-entities";
import { GmailApiError } from "./errors";
import type { GmailMessage, AttachmentMeta, NodeErrorCode } from "../types";
import { existsSync } from "node:fs";

export function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== pathDirname(dir)) {
    const hasPackageJson = existsSync(resolve(dir, "package.json"));
    const isInsideMastraOutput = dir.includes(".mastra");
    if (hasPackageJson && !isInsideMastraOutput) return dir;
    dir = pathDirname(dir);
  }
  return startDir;
}

export function must(
  condition: unknown,
  message: string,
): Effect.Effect<void, GmailApiError> {
  return condition
    ? Effect.void
    : Effect.fail(new GmailApiError({ message, cause: new Error(message) }));
}

export function toGmailMessage(
  d: gmail_v1.Schema$Message,
): Effect.Effect<GmailMessage, GmailApiError> {
  if (!d.id || !d.threadId) {
    return Effect.fail(
      new GmailApiError({
        message: `Malformed message: id=${d.id ?? "missing"}, threadId=${d.threadId ?? "missing"}`,
        cause: new Error("malformed message"),
      }),
    );
  }
  return Effect.succeed({
    id: d.id,
    threadId: d.threadId,
    snippet: decodeHtmlEntities(d.snippet ?? ""),
    internalDate: d.internalDate ?? "",
    subject: decodeHtmlEntities(extractHeader(d.payload?.headers, "Subject")),
    from: decodeHtmlEntities(extractHeader(d.payload?.headers, "From")),
  });
}

export function extractHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | null | undefined,
  name: string,
): string {
  if (!headers) return "";
  const lower = name.toLowerCase();
  return headers.find((h) => h.name?.toLowerCase() === lower)?.value ?? "";
}

export function decodeBase64Url(data: string): Buffer {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function sanitizeFilename(raw: string): string {
  return raw.replace(/[/\\?%*:|"<>]/g, "_").trim();
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | null | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  return (
    headers.find((h) => h.name?.toLowerCase() === lower)?.value ?? undefined
  );
}

function isInline(part: gmail_v1.Schema$MessagePart): boolean {
  const disposition = getHeader(part.headers, "Content-Disposition") ?? "";
  if (disposition) return disposition.toLowerCase().startsWith("inline");
  return !!getHeader(part.headers, "Content-ID");
}

export function collectAttachments(
  part: gmail_v1.Schema$MessagePart,
  includeInline: boolean,
  maxSizeBytes?: number,
  skipMimeTypes?: string[],
): AttachmentMeta[] {
  const results: AttachmentMeta[] = [];
  if (part.parts) {
    for (const child of part.parts)
      results.push(
        ...collectAttachments(
          child,
          includeInline,
          maxSizeBytes,
          skipMimeTypes,
        ),
      );
  }
  const filename = part.filename;
  const attachmentId = part.body?.attachmentId;
  if (!filename || !attachmentId) return results;
  const inline = isInline(part);
  if (inline && !includeInline) return results;
  const size = part.body?.size ?? 0;
  if (!!maxSizeBytes && size > maxSizeBytes) return results;
  const mimeType = part.mimeType ?? "application/octet-stream";
  if (skipMimeTypes?.includes(mimeType)) return results;
  results.push({
    partId: part.partId ?? attachmentId,
    filename,
    mimeType,
    attachmentId,
    size,
    inline,
  });
  return results;
}

function normalizeError(cause: unknown): {
  message: string;
  status: number | undefined;
  cause: unknown;
} {
  const message = cause instanceof Error ? cause.message : String(cause);
  const status = cause instanceof GmailApiError ? cause.status : undefined;
  return { message, status, cause };
}

const retrySchedule = Schedule.exponential("1 second").pipe(
  Schedule.either(Schedule.spaced("5 seconds")),
  Schedule.upTo("30 seconds"),
);

function isRetryable(err: GmailApiError): boolean {
  const status = err.status;
  return status === 429 || (!!status && status >= 500 && status < 600);
}

export function callAPI<T>(
  fn: () => Promise<T>,
): Effect.Effect<T, GmailApiError> {
  return Effect.tryPromise({
    try: fn,
    catch: (cause) => {
      const error = normalizeError(cause);
      return new GmailApiError(error);
    },
  }).pipe(Effect.retry({ schedule: retrySchedule, while: isRetryable }));
}

export function isEEXIST(err: unknown): boolean {
  return isNodeError(err, "EEXIST");
}

function isNodeError(
  err: unknown,
  ...codes: [NodeErrorCode, ...NodeErrorCode[]]
): err is NodeJS.ErrnoException {
  return (
    err instanceof Error &&
    codes.includes(((err as NodeJS.ErrnoException).code as NodeErrorCode) ?? "")
  );
}
