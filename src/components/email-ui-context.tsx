"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  EmailPreviewFields,
  HighlightSearchResultsInput,
  SearchResultItem,
} from "@/lib/email-ui-schemas";
import type { DownloadLink } from "@/lib/parse-download-result";
import { decodeHtmlEntities } from "@/lib/decode-html-entities";

export interface EmailPreviewState {
  messageId: string;
  subject: string;
  from: string;
  snippet: string;
  internalDate: string;
}

export interface SearchHighlightState {
  query?: string;
  messages: SearchResultItem[];
  focusIndex?: number;
}

interface EmailUiContextValue {
  preview: EmailPreviewState | null;
  openPreview: (fields: EmailPreviewFields) => void;
  closePreview: () => void;
  highlights: SearchHighlightState | null;
  setHighlights: (input: HighlightSearchResultsInput) => void;
  clearHighlights: () => void;
  focusPreviewByMessageId: (messageId: string) => void;
  /** Latest browser-download result — single panel, avoids duplicate inline tool UI. */
  downloadReady: DownloadLink[] | null;
  setDownloadReady: (links: DownloadLink[] | null) => void;
  clearDownloadReady: () => void;
}

const EmailUiContext = createContext<EmailUiContextValue | null>(null);

function toPreviewState(fields: EmailPreviewFields): EmailPreviewState {
  return {
    messageId: fields.messageId,
    subject: decodeHtmlEntities(fields.subject ?? "(No subject)"),
    from: decodeHtmlEntities(fields.from ?? "Unknown sender"),
    snippet: decodeHtmlEntities(fields.snippet ?? ""),
    internalDate: fields.internalDate ?? "",
  };
}

export function EmailUiProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<EmailPreviewState | null>(null);
  const [highlights, setHighlightsState] =
    useState<SearchHighlightState | null>(null);
  const [downloadReady, setDownloadReadyState] = useState<DownloadLink[] | null>(
    null,
  );

  const openPreview = useCallback((fields: EmailPreviewFields) => {
    setPreview(toPreviewState(fields));
  }, []);

  const closePreview = useCallback(() => {
    setPreview(null);
  }, []);

  const setHighlights = useCallback((input: HighlightSearchResultsInput) => {
    setHighlightsState({
      query: input.query,
      messages: input.messages.map((m) => ({
        ...m,
        subject: decodeHtmlEntities(m.subject),
        from: decodeHtmlEntities(m.from),
        snippet: decodeHtmlEntities(m.snippet),
      })),
      focusIndex: input.focusIndex,
    });
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightsState(null);
  }, []);

  const setDownloadReady = useCallback((links: DownloadLink[] | null) => {
    setDownloadReadyState(links);
  }, []);

  const clearDownloadReady = useCallback(() => {
    setDownloadReadyState(null);
  }, []);

  const focusPreviewByMessageId = useCallback((messageId: string) => {
    const fromHighlights = highlights?.messages.find((m) => m.id === messageId);
    if (fromHighlights) {
      openPreview({
        messageId: fromHighlights.id,
        subject: fromHighlights.subject,
        from: fromHighlights.from,
        snippet: fromHighlights.snippet,
        internalDate: fromHighlights.internalDate,
      });
      return;
    }
    if (preview?.messageId === messageId) return;
    openPreview({ messageId });
  }, [highlights?.messages, openPreview, preview?.messageId]);

  const value = useMemo(
    () => ({
      preview,
      openPreview,
      closePreview,
      highlights,
      setHighlights,
      clearHighlights,
      focusPreviewByMessageId,
      downloadReady,
      setDownloadReady,
      clearDownloadReady,
    }),
    [
      preview,
      openPreview,
      closePreview,
      highlights,
      setHighlights,
      clearHighlights,
      focusPreviewByMessageId,
      downloadReady,
      setDownloadReady,
      clearDownloadReady,
    ],
  );

  return (
    <EmailUiContext.Provider value={value}>{children}</EmailUiContext.Provider>
  );
}

export function useEmailUi() {
  const ctx = useContext(EmailUiContext);
  if (!ctx) {
    throw new Error("useEmailUi must be used within EmailUiProvider");
  }
  return ctx;
}
