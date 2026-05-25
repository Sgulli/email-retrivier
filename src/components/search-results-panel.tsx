"use client";

import { formatEmailDate } from "@/lib/email-ui-schemas";
import { useEmailUi } from "./email-ui-context";
import { Button } from "@/components/ui/button";

export function SearchResultsPanel() {
  const { highlights, clearHighlights, focusPreviewByMessageId, preview } =
    useEmailUi();

  if (!highlights || highlights.messages.length === 0) return null;
  if (preview) return null;

  return (
    <aside
      className="hidden md:flex fixed top-0 right-0 z-40 h-full w-72 flex-col border-l border-border bg-card shadow-lg"
      aria-label="Search results highlights"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Search highlights
          </p>
          {highlights.query && (
            <p className="text-xs text-muted-foreground truncate mt-0.5" title={highlights.query}>
              {highlights.query}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={clearHighlights}
        >
          Clear
        </Button>
      </div>

      <ul className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1.5">
        {highlights.messages.map((msg, index) => {
          const rank = index + 1;
          const isFocused = highlights.focusIndex === rank;
          return (
            <li key={msg.id}>
              <button
                type="button"
                onClick={() => focusPreviewByMessageId(msg.id)}
                className={`w-full text-left rounded-lg border px-2.5 py-2 transition-colors cursor-pointer ${
                  isFocused
                    ? "border-primary bg-accent"
                    : "border-border bg-background hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded text-xs font-bold ${
                    isFocused
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {rank}
                </span>
                <p className="mt-1 text-sm font-medium text-foreground line-clamp-2">
                  {msg.subject || "(No subject)"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{msg.from}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatEmailDate(msg.internalDate)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
