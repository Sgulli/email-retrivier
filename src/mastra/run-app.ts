import { Context, Effect, ManagedRuntime } from "effect";
import { AppLayer } from "./runtime";
import { GmailService } from "./gmail/service";
import { AttachmentService } from "./gmail/attachment.service";
import { MinioService } from "./lib/minio";
import { DbService } from "./lib/db";
import type { AuthError } from "./lib/errors";
import {
  requireUserId,
  type EmailToolContext,
} from "./request-context";

export type { EmailToolContext } from "./request-context";
export { requireUserId, getRequestUser } from "./request-context";

/** Services tool handlers and API routes may require from the app layer. */
export type AppServices = GmailService | AttachmentService | MinioService;

export type Db = Context.Tag.Service<typeof DbService>;
export type Gmail = Context.Tag.Service<typeof GmailService>;
export type Attachments = Context.Tag.Service<typeof AttachmentService>;
export type Minio = Context.Tag.Service<typeof MinioService>;

type AppRuntime = ManagedRuntime.ManagedRuntime<AppServices, AuthError>;

const runtimeByUser = new Map<string, AppRuntime>();

function getRuntime(userId: string): AppRuntime {
  const cached = runtimeByUser.get(userId);
  if (cached) return cached;
  const runtime = ManagedRuntime.make(AppLayer(userId));
  runtimeByUser.set(userId, runtime);
  return runtime;
}

let dbRuntime: ManagedRuntime.ManagedRuntime<DbService, never> | undefined;

function getDbRuntime(): ManagedRuntime.ManagedRuntime<DbService, never> {
  if (!dbRuntime) {
    dbRuntime = ManagedRuntime.make(DbService.Default);
  }
  return dbRuntime;
}

/** @internal */
export function runAppEffect<A, E>(
  userId: string,
  program: Effect.Effect<A, E, AppServices>,
): Promise<A> {
  return getRuntime(userId).runPromise(program);
}

/** @internal */
export function runDbEffect<A, E>(
  program: Effect.Effect<A, E, DbService>,
): Promise<A> {
  return getDbRuntime().runPromise(program);
}

/**
 * Run a DB effect at the boundary. Prefer this over `runDbEffect(Effect.flatMap(DbService, …))`.
 *
 * @example
 * return withDb((db) => db.getUserByIdPrefix(userId));
 */
export function withDb<A, E>(
  fn: (db: Db) => Effect.Effect<A, E, never>,
): Promise<A> {
  return runDbEffect(Effect.flatMap(DbService, fn));
}

/**
 * Authenticated Mastra tool + DB. Pulls `user.id` from `requestContext` then runs `withDb`.
 *
 * @example
 * execute: (_, ctx) =>
 *   withDbUser(ctx, (userId, db) =>
 *     db.getUserByIdPrefix(userId).pipe(Effect.map(toFoundUser)),
 *   ),
 */
export function withDbUser<A, E>(
  context: EmailToolContext,
  fn: (userId: string, db: Db) => Effect.Effect<A, E, never>,
): Promise<A> {
  return withDb((db) => fn(requireUserId(context), db));
}

export function withApp<A, E>(
  userId: string,
  program: Effect.Effect<A, E, AppServices>,
): Promise<A> {
  return runAppEffect(userId, program);
}

export function withGmail<A, E>(
  userId: string,
  fn: (gmail: Gmail) => Effect.Effect<A, E, never>,
): Promise<A> {
  return withApp(userId, Effect.flatMap(GmailService, fn));
}

export function withAttachments<A, E>(
  userId: string,
  fn: (attachments: Attachments) => Effect.Effect<A, E, never>,
): Promise<A> {
  return withApp(userId, Effect.flatMap(AttachmentService, fn));
}

export function withAppUser<A, E>(
  context: EmailToolContext,
  program: (userId: string) => Effect.Effect<A, E, AppServices>,
): Promise<A> {
  const userId = requireUserId(context);
  return withApp(userId, program(userId));
}

export function withGmailUser<A, E>(
  context: EmailToolContext,
  fn: (userId: string, gmail: Gmail) => Effect.Effect<A, E, never>,
): Promise<A> {
  const userId = requireUserId(context);
  return withGmail(userId, (gmail) => fn(userId, gmail));
}

export function withAttachmentsUser<A, E>(
  context: EmailToolContext,
  fn: (attachments: Attachments) => Effect.Effect<A, E, never>,
): Promise<A> {
  return withAttachments(requireUserId(context), fn);
}
