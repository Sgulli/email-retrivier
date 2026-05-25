import { z } from "zod";

export const emailAttachmentSchema = z.object({
  attachmentId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  inline: z.boolean(),
});

export type EmailAttachment = z.infer<typeof emailAttachmentSchema>;

export const emailMessageDetailSchema = z.object({
  messageId: z.string(),
  subject: z.string().optional(),
  from: z.string().optional(),
  snippet: z.string().optional(),
  internalDate: z.string().optional(),
  attachments: z.array(emailAttachmentSchema).default([]),
});

export type EmailMessageDetail = z.infer<typeof emailMessageDetailSchema>;
