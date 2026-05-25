"use client";

import { AttachmentIcon } from "./attachment-icon";
import { useEmailMessageDetail } from "@/hooks/use-email-message-detail";
import { formatFileSize } from "@/lib/attachment-display";
import type { EmailAttachment } from "@/lib/email-message-detail";
import type { EmailPreviewState } from "./email-ui-context";
import { Skeleton } from "@/components/ui/skeleton";

function AttachmentRow({ attachment }: { attachment: EmailAttachment }) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-2.5 py-2">
      <AttachmentIcon
        mimeType={attachment.mimeType}
        filename={attachment.filename}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate" title={attachment.filename}>
          {attachment.filename}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatFileSize(attachment.size)}
          {attachment.inline ? " · inline" : ""}
        </p>
      </div>
    </li>
  );
}

export function EmailPreviewDetailBody({ preview }: { preview: EmailPreviewState }) {
  const { detail, loading, error } = useEmailMessageDetail(preview.messageId);

  const snippet = detail?.snippet ?? preview.snippet;
  const attachments = detail?.attachments ?? [];
  const fileAttachments = attachments.filter((a) => !a.inline);
  const listed = fileAttachments.length > 0 ? fileAttachments : attachments;

  return (
    <div className="flex flex-col gap-4">
      <section>
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : snippet ? (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {snippet}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No preview text available.</p>
        )}
      </section>

      {!loading && !error && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Attachments{listed.length > 0 ? ` (${listed.length})` : ""}
          </h3>
          {listed.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {listed.map((a) => (
                <AttachmentRow key={a.attachmentId} attachment={a} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No attachments on this message.</p>
          )}
        </section>
      )}
    </div>
  );
}
