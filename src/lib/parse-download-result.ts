import { z } from "zod";

export const downloadLinkSchema = z.object({
  filename: z.string(),
  size: z.number(),
  objectName: z.string(),
  presignedUrl: z.string().optional(),
});

export type DownloadLink = z.infer<typeof downloadLinkSchema>;

export const browserDownloadResultSchema = z.object({
  downloadLinks: z.array(downloadLinkSchema).default([]),
});

export type BrowserDownloadResult = z.infer<typeof browserDownloadResultSchema>;

/**
 * Parse the JSON-stringified result emitted by the `browser-download`
 * Mastra tool through AG-UI / CopilotKit.
 *
 * Returns the parsed list of download links, or `null` if the input
 * is missing, malformed, or fails schema validation.
 */
export function parseDownloadResult(raw: string | undefined): DownloadLink[] | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = browserDownloadResultSchema.safeParse(parsed);
  if (!result.success) return null;

  return result.data.downloadLinks;
}
