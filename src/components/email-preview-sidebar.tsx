"use client";

import { useEmailUi } from "./email-ui-context";
import { formatEmailDate } from "@/lib/email-ui-schemas";
import { useEmailMessageDetail } from "@/hooks/use-email-message-detail";
import { EmailPreviewDetailBody } from "./email-preview-detail-body";
import { Button } from "@/components/ui/button";
import { XIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

export function EmailPreviewSidebarDetail() {
  const { preview, closePreview, highlights } = useEmailUi();
  const { detail, loading } = useEmailMessageDetail(preview?.messageId);
  const [fullscreen, setFullscreen] = useState(false);

  if (!preview) return null;

  const subject = detail?.subject ?? preview.subject;
  const from = detail?.from ?? preview.from;
  const internalDate = detail?.internalDate ?? preview.internalDate;

  return (
    <>
      <aside
        className="hidden md:flex fixed top-0 right-0 z-40 h-full w-80 flex-col border-l border-border bg-card shadow-lg"
        aria-label="Email preview"
      >
        <header className="shrink-0 border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            {highlights && highlights.messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={closePreview}>
                ← Results
              </Button>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setFullscreen(true)}
                aria-label="Open full screen"
              >
                <Maximize2Icon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={closePreview}
                aria-label="Close preview"
              >
                <XIcon />
              </Button>
            </div>
          </div>
          <h2 className="mt-2 text-sm font-semibold text-foreground line-clamp-2">
            {subject}
          </h2>
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={from}>
            {from}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatEmailDate(internalDate)}
          </p>
          {detail && detail.attachments.length > 0 && (
            <p className="text-xs text-primary mt-1">
              {detail.attachments.length} attachment
              {detail.attachments.length === 1 ? "" : "s"}
            </p>
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
          <EmailPreviewDetailBody preview={preview} />
        </div>

        <footer className="shrink-0 border-t border-border px-3 py-2 text-[10px] text-muted-foreground font-mono truncate">
          {preview.messageId}
        </footer>
      </aside>

      <Dialog open={fullscreen} onOpenChange={(open) => !open && setFullscreen(false)}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[100]"
          className="fixed inset-0 top-0 left-0 z-[100] m-0 flex h-dvh w-dvw max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none"
        >
          <DialogDescription className="sr-only">
            Full screen view: {subject}
          </DialogDescription>
          <DialogHeader className="flex flex-row items-center justify-between gap-2 border-b border-border px-4 py-3 shrink-0">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg truncate">{subject}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setFullscreen(false)}
              aria-label="Close full screen"
            >
              <Minimize2Icon />
            </Button>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-5 flex flex-col gap-6">
              <header className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-foreground">{subject}</h1>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                  <span className="text-muted-foreground">From:</span>
                  <span className="text-foreground">{from}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground">{formatEmailDate(internalDate)}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm font-mono">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="text-muted-foreground text-xs truncate">{preview.messageId}</span>
                </div>
                {detail && detail.attachments.length > 0 && (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                    <span className="text-muted-foreground">Attachments:</span>
                    <span className="text-foreground">{detail.attachments.length}</span>
                  </div>
                )}
              </header>

              <div className="border-t border-border pt-6">
                <div className="text-sm text-foreground leading-relaxed max-w-none">
                  <EmailPreviewDetailBody preview={preview} />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
