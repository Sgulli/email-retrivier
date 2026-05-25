"use client";

import { DownloadPanel } from "./download-panel";
import { useEmailUi } from "./email-ui-context";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

export function DownloadReadyPanel() {
  const { downloadReady, clearDownloadReady } = useEmailUi();

  if (!downloadReady?.length) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
      role="region"
      aria-label="Attachment download"
    >
      <div className="relative">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={clearDownloadReady}
          className="absolute -top-2 -right-2 z-10 rounded-full border border-border bg-background shadow-sm"
          aria-label="Dismiss download panel"
        >
          <XIcon />
        </Button>
        <DownloadPanel files={downloadReady} />
      </div>
    </div>
  );
}
