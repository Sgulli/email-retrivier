import { Data } from "effect";

export class GmailApiError extends Data.TaggedError("GmailApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly cause?: unknown;
}> {}

export class AuthError extends Data.TaggedError("AuthError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class FileSystemError extends Data.TaggedError("FileSystemError")<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class DBError extends Data.TaggedError("DBError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
