"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import {
  emailPreviewFieldsSchema,
  highlightSearchResultsSchema,
  type EmailPreviewFields,
} from "@/lib/email-ui-schemas";
import { useEmailUi } from "./email-ui-context";
import { emailMessageDetailSchema } from "@/lib/email-message-detail";

async function fetchMessagePreview(
  messageId: string,
): Promise<EmailPreviewFields | null> {
  const res = await fetch(`/api/email/${encodeURIComponent(messageId)}`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const parsed = emailMessageDetailSchema.safeParse(data);
  if (!parsed.success) return null;
  const { messageId: id, subject, from, snippet, internalDate } = parsed.data;
  return { messageId: id, subject, from, snippet, internalDate };
}

function hasPreviewFields(fields: EmailPreviewFields): boolean {
  return Boolean(fields.subject ?? fields.from ?? fields.snippet);
}

export function EmailFrontendTools() {
  const { openPreview, setHighlights } = useEmailUi();

  useFrontendTool({
    name: "preview-email",
    description:
      "Open a visual email preview modal for the user. Call after search-emails or get-message when the user wants to see a message, open an email, or view details. Pass all known fields when available; messageId alone is enough to fetch the rest.",
    parameters: emailPreviewFieldsSchema,
    handler: async (args) => {
      let fields: EmailPreviewFields = args;
      if (!hasPreviewFields(args)) {
        const fetched = await fetchMessagePreview(args.messageId);
        if (!fetched) {
          return "Could not open preview: failed to load that message.";
        }
        fields = fetched;
      }
      openPreview(fields);
      return `Opened preview for "${fields.subject ?? "message"}".`;
    },
    render: ({ status, args }) => {
      if (status === "complete") {
        return (
          <p className="text-sm text-muted-foreground my-1">
            Opened preview
            {args.subject ? `: ${args.subject}` : ""}.
          </p>
        );
      }
      return (
        <p className="text-sm text-muted-foreground my-1">Opening email preview…</p>
      );
    },
  });

  useFrontendTool({
    name: "highlight-search-results",
    description:
      "Highlight Gmail search results in the side panel. Call right after search-emails (or get-latest-email) when you found messages — pass the same messages array and query. Use focusIndex (1-based) to emphasize one result the user asked about.",
    parameters: highlightSearchResultsSchema,
    handler: async ({ query, messages, focusIndex }) => {
      setHighlights({ query, messages, focusIndex });
      const count = messages.length;
      const focus =
        focusIndex && focusIndex >= 1 && focusIndex <= count
          ? ` (focused #${focusIndex})`
          : "";
      return `Highlighted ${count} result${count === 1 ? "" : "s"} in the panel${focus}.`;
    },
    render: ({ status, args }) => {
      const n = args.messages?.length ?? 0;
      if (status === "complete") {
        return (
          <p className="text-sm text-muted-foreground my-1">
            {n} result{n === 1 ? "" : "s"} highlighted
            {args.query ? ` for \u201c${args.query}\u201d` : ""}.
          </p>
        );
      }
      return (
        <p className="text-sm text-muted-foreground my-1">Updating search highlights…</p>
      );
    },
  });

  return null;
}
