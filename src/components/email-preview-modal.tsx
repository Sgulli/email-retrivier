"use client";

import { formatEmailDate } from "@/lib/email-ui-schemas";
import { EmailPreviewDetailBody } from "./email-preview-detail-body";
import { useEmailUi } from "./email-ui-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function EmailPreviewModal() {
  const { preview, closePreview } = useEmailUi();

  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && closePreview()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 sm:max-w-lg"
      >
        <DialogDescription className="sr-only">
          {preview ? `Email from ${preview.from}` : "Email message preview"}
        </DialogDescription>
        {preview && (
          <>
            <DialogHeader className="px-4 py-3 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate">{preview.subject}</DialogTitle>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{preview.from}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatEmailDate(preview.internalDate)}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto px-4 py-3 flex-1">
              <EmailPreviewDetailBody preview={preview} />
            </div>

            <footer className="border-t border-border px-4 py-2 text-xs text-muted-foreground font-mono truncate">
              {preview.messageId}
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
