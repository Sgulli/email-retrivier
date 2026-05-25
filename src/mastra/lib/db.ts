import { Effect } from "effect";
import { DatabaseSync } from "node:sqlite";
import { DBError } from "./errors";

export const dbPath =
  process.env.DATABASE_URL?.replace("file:", "") || "./data/mastra.db";

const dbInstance = new DatabaseSync(dbPath);

export type GoogleAccountAuth = {
  readonly refreshToken: string;
  readonly scope: string;
};

export type AuthUserRecord = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailVerified: boolean;
};

export class DbService extends Effect.Service<DbService>()("DbService", {
  sync: () => {
    const getRefreshToken = (userId: string) =>
      Effect.try({
        try: () => {
          const stmt = dbInstance.prepare(
            "SELECT a.refreshToken FROM account a JOIN user u ON u.id = a.userId WHERE a.providerId = 'google' AND u.id = ? AND a.refreshToken IS NOT NULL LIMIT 1",
          );
          const row = stmt.get(userId) as { refreshToken?: unknown } | undefined;
          const refreshToken = row?.refreshToken ?? null;
          return refreshToken != null ? String(refreshToken) : null;
        },
        catch: (cause) =>
          new DBError({
            message: "Failed to read refresh token from database",
            cause,
          }),
      });

    const getGoogleAccount = (userId: string) =>
      Effect.try({
        try: () => {
          const stmt = dbInstance.prepare(
            "SELECT a.refreshToken, a.scope FROM account a WHERE a.userId = ? AND a.providerId = 'google' AND a.refreshToken IS NOT NULL LIMIT 1",
          );
          const row = stmt.get(userId) as
            | { refreshToken?: unknown; scope?: unknown }
            | undefined;
          if (row?.refreshToken == null) return null;
          return {
            refreshToken: String(row.refreshToken),
            scope: row.scope != null ? String(row.scope) : "",
          } satisfies GoogleAccountAuth;
        },
        catch: (cause) =>
          new DBError({
            message: "Failed to read Google account from database",
            cause,
          }),
      });

    const getUserByIdPrefix = (userId: string) =>
      Effect.try({
        try: () => {
          const stmt = dbInstance.prepare(
            "SELECT id, name, email, emailVerified FROM user WHERE id LIKE ? || '%' OR email LIKE ? || '%' LIMIT 1",
          );
          const row = stmt.get(userId, userId) as
            | {
                id: string;
                name: string;
                email: string;
                emailVerified: number;
              }
            | undefined;
          if (!row) return null;
          return {
            id: row.id,
            name: row.name,
            email: row.email,
            emailVerified: row.emailVerified === 1,
          } satisfies AuthUserRecord;
        },
        catch: (cause) =>
          new DBError({
            message: "Failed to read user from database",
            cause,
          }),
      });

    return { getRefreshToken, getGoogleAccount, getUserByIdPrefix } as const;
  },
}) {}
