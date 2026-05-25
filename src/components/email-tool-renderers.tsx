"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { parseDownloadResult } from "@/lib/parse-download-result";
import { useEmailUi } from "./email-ui-context";
import { useEffect } from "react";

export function EmailToolRenderers() {
  const { setDownloadReady } = useEmailUi();

  useRenderTool({
    name: "browser-download",
    parameters: z.object({ messageId: z.string() }),
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <p className="text-sm text-gray-500 my-1">Preparing your attachments…</p>
        );
      }

      const links = parseDownloadResult(result);
      return (
        <BrowserDownloadStatus
          links={links}
          onReady={(ready) => setDownloadReady(ready)}
        />
      );
    },
  });

  return null;
}

/** Pushes links into the shared panel; inline chat shows at most one status line. */
function BrowserDownloadStatus({
  links,
  onReady,
}: {
  links: ReturnType<typeof parseDownloadResult>;
  onReady: (links: NonNullable<ReturnType<typeof parseDownloadResult>>) => void;
}) {
  useEffect(() => {
    if (links?.length) onReady(links);
  }, [links, onReady]);

  if (!links?.length) {
    return (
      <p className="text-sm text-gray-600 my-1">
        No attachments were found on that message.
      </p>
    );
  }

  // Full DownloadPanel lives in DownloadReadyPanel (one instance for the thread).
  return null;
}
