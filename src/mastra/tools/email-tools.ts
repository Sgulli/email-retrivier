import { Effect } from "effect";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { AttachmentService } from "../gmail/attachment.service";
import { MinioService } from "../lib/minio";
import { foundUser, gmailAuthStatus } from "../lib/db-results";
import { emailToolRequestContext } from "../request-context";
import {
  withAppUser,
  withAttachmentsUser,
  withDbUser,
  withGmailUser,
} from "../run-app";

export const searchEmailsTool = createTool({
  ...emailToolRequestContext,
  id: "search-emails",
  description:
    "Search Gmail messages by query string. Supports Gmail search operators like 'from:', 'subject:', 'has:attachment', etc. Returns matching messages with subject, sender, and snippet.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Gmail search query. Use operators like from:email, subject:text, has:attachment, newer_than:7d, etc.",
      ),
    maxResults: z
      .number()
      .optional()
      .describe("Maximum number of messages to return (1-500, default 20)"),
  }),
  outputSchema: z.object({
    messages: z.array(
      z.object({
        id: z.string(),
        threadId: z.string(),
        subject: z.string(),
        from: z.string(),
        snippet: z.string(),
        internalDate: z.string(),
      }),
    ),
    resultSizeEstimate: z.number(),
    nextPageToken: z.string().nullable().optional(),
  }),
  execute: async ({ query, maxResults }, context) =>
    withGmailUser(context, (_userId, gmail) =>
      gmail.fetchMessages({ query, maxResults }),
    ),
});

export const listLabelsTool = createTool({
  ...emailToolRequestContext,
  id: "list-labels",
  description:
    "List all Gmail labels for the authenticated account. Returns label names only.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    labels: z.array(z.string()),
  }),
  execute: async (_input, context) => {
    const labels = await withGmailUser(context, (_userId, gmail) =>
      gmail.fetchLabels,
    );
    return { labels };
  },
});

export const getMessageTool = createTool({
  ...emailToolRequestContext,
  id: "get-message",
  description:
    "Get full details of a single Gmail message by ID, including subject, sender, snippet, and body preview.",
  inputSchema: z.object({
    messageId: z.string().describe("The Gmail message ID to retrieve"),
  }),
  outputSchema: z.object({
    id: z.string(),
    threadId: z.string(),
    subject: z.string(),
    from: z.string(),
    snippet: z.string(),
    internalDate: z.string(),
  }),
  execute: async ({ messageId }, context) =>
    withGmailUser(context, (_userId, gmail) => gmail.fetchMessage(messageId)),
});

export const downloadAttachmentsTool = createTool({
  ...emailToolRequestContext,
  id: "download-attachments",
  description:
    "Download all attachments from a Gmail message by ID. Saves files to the specified output directory.",
  inputSchema: z.object({
    messageId: z
      .string()
      .describe("The Gmail message ID to download attachments from"),
    outputDir: z
      .string()
      .describe("Directory path where attachments will be saved"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        attachmentId: z.string(),
        filename: z.string(),
        savedPath: z.string(),
        size: z.number(),
      }),
    ),
  }),
  execute: async ({ messageId, outputDir }, context) => {
    const results = await withAttachmentsUser(context, (attachments) =>
      attachments.downloadAllAttachments(messageId, outputDir),
    );
    return { results };
  },
});

export const getLatestEmailTool = createTool({
  ...emailToolRequestContext,
  id: "get-latest-email",
  description:
    "Fetch the most recent (newest) email matching a query in one step. Returns the full message + how many total matches exist. Use when the user asks for 'the latest email', 'my most recent email', or 'the newest email' from someone or about something.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Gmail search query. Use operators like from:email, subject:text, has:attachment, newer_than:7d, etc. Defaults to all inbox if omitted.",
      ),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    totalMatches: z.number(),
    message: z
      .object({
        id: z.string(),
        threadId: z.string(),
        subject: z.string(),
        from: z.string(),
        snippet: z.string(),
        internalDate: z.string(),
      })
      .nullable(),
  }),
  execute: async ({ query }, context) =>
    withGmailUser(context, (_userId, gmail) =>
      gmail.fetchMessages({ query, maxResults: 1 }).pipe(
        Effect.map((result) =>
          result.messages.length === 0
            ? { found: false as const, totalMatches: 0, message: null }
            : {
                found: true as const,
                totalMatches: result.resultSizeEstimate,
                message: result.messages[0]!,
              },
        ),
      ),
    ),
});

export const getOldestEmailTool = createTool({
  ...emailToolRequestContext,
  id: "get-oldest-email",
  description:
    "Fetch the oldest (first ever) email matching a query. Gmail always returns newest first, so this tool paginates back to the last page to find the oldest message. Use when the user asks for 'the first email', 'the oldest email', 'my earliest email', or 'the very first message'.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe(
        "Optional Gmail search query to filter. If omitted, searches all inbox messages.",
      ),
    maxPages: z
      .number()
      .optional()
      .describe(
        "Maximum number of pages to paginate through (each page = 100 messages). Defaults to 200, meaning up to 20,000 messages scanned. Increase if your inbox is larger.",
      ),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    totalMatches: z.number(),
    pagesScanned: z.number(),
    message: z
      .object({
        id: z.string(),
        threadId: z.string(),
        subject: z.string(),
        from: z.string(),
        snippet: z.string(),
        internalDate: z.string(),
      })
      .nullable(),
  }),
  execute: async ({ query, maxPages }, context) =>
    withGmailUser(context, (_userId, gmail) =>
      Effect.gen(function* () {
        const limit = maxPages ?? 200;
        let pages = 0;
        let lastResult = yield* gmail.fetchMessages({
          query,
          maxResults: 100,
        });

        if (lastResult.messages.length === 0) {
          return {
            found: false as const,
            totalMatches: 0,
            pagesScanned: 0,
            message: null,
          };
        }

        pages = 1;

        while (lastResult.nextPageToken && pages < limit) {
          lastResult = yield* gmail.fetchMessages({
            query,
            maxResults: 100,
            pageToken: lastResult.nextPageToken,
          });
          if (lastResult.messages.length === 0) break;
          pages++;
        }

        const oldest = lastResult.messages[lastResult.messages.length - 1]!;

        return {
          found: true as const,
          totalMatches: lastResult.resultSizeEstimate,
          pagesScanned: pages,
          message: oldest,
        };
      }),
    ),
});

export const checkGmailAuthTool = createTool({
  ...emailToolRequestContext,
  id: "check-gmail-auth",
  description:
    "Check if the user has authenticated with Google for Gmail access. Returns the auth status and, if not authenticated, the URL to sign in.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    authenticated: z.boolean(),
    loginUrl: z.string().optional(),
    message: z.string(),
  }),
  execute: async (_input, context) =>
    withDbUser(context, (userId, db) =>
      db.getGoogleAccount(userId).pipe(Effect.map(gmailAuthStatus)),
    ),
});

export const browserDownloadTool = createTool({
  ...emailToolRequestContext,
  id: "browser-download",
  description:
    "Download all attachments from a Gmail message and upload them to MinIO for browser download. Returns download links the user can use in their browser.",
  inputSchema: z.object({
    messageId: z
      .string()
      .describe("The Gmail message ID to download attachments from"),
  }),
  outputSchema: z.object({
    downloadLinks: z.array(
      z.object({
        filename: z.string(),
        size: z.number(),
        objectName: z.string(),
        presignedUrl: z.string().optional(),
      }),
    ),
  }),
  execute: async ({ messageId }, context) =>
    withAppUser(context, () =>
      Effect.gen(function* () {
        const attachmentSvc = yield* AttachmentService;
        const minioSvc = yield* MinioService;

        const metas = yield* attachmentSvc.listAttachments(messageId);
        if (metas.length === 0) return { downloadLinks: [] };

        const downloadLinks: {
          filename: string;
          size: number;
          objectName: string;
          presignedUrl: string;
        }[] = [];
        for (const meta of metas) {
          const buffer = yield* attachmentSvc.fetchAttachment(
            messageId,
            meta.attachmentId,
          );
          const result = yield* minioSvc.uploadFile(
            buffer,
            meta.filename,
            meta.mimeType,
          );
          const presignedUrl = yield* minioSvc.getPresignedUrl(
            result.objectName,
            3600,
          );
          downloadLinks.push({
            filename: meta.filename,
            size: buffer.length,
            objectName: result.objectName,
            presignedUrl,
          });
        }
        return { downloadLinks };
      }),
    ),
});

export const getUserTool = createTool({
  ...emailToolRequestContext,
  id: "get-user",
  description:
    "Look up a user by id or email from the Better Auth database. At least one parameter is required.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    found: z.boolean(),
    user: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        emailVerified: z.boolean(),
      })
      .nullable(),
  }),
  execute: async (_, context) =>
    withDbUser(context, (userId, db) =>
      db.getUserByIdPrefix(userId).pipe(Effect.map(foundUser)),
    ),
});
