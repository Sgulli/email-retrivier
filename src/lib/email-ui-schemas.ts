import { z } from "zod";

export const emailPreviewFieldsSchema = z.object({
  messageId: z.string().describe("Gmail message ID"),
  subject: z.string().optional(),
  from: z.string().optional(),
  snippet: z.string().optional(),
  internalDate: z.string().optional(),
});

export type EmailPreviewFields = z.infer<typeof emailPreviewFieldsSchema>;

export const searchResultItemSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  snippet: z.string(),
  internalDate: z.string(),
});

export type SearchResultItem = z.infer<typeof searchResultItemSchema>;

export const highlightSearchResultsSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("The Gmail search query that produced these results"),
  messages: z
    .array(searchResultItemSchema)
    .min(1)
    .describe("Messages to highlight in the results panel"),
  focusIndex: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("1-based index of the result to emphasize (e.g. 1 for the first)"),
});

export type HighlightSearchResultsInput = z.infer<
  typeof highlightSearchResultsSchema
>;

export function formatEmailDate(internalDate: string | undefined): string {
  if (!internalDate) return "Unknown date";
  const ms = Number(internalDate);
  if (!Number.isFinite(ms)) return internalDate;
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
