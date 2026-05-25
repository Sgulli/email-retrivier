"use client";

import { useSyncExternalStore } from "react";
import {
  emailMessageDetailSchema,
  type EmailMessageDetail,
} from "@/lib/email-message-detail";

const detailCache = new Map<string, EmailMessageDetail>();
const errorCache = new Map<string, string>();
const inflight = new Map<string, Promise<EmailMessageDetail | null>>();
const snapshotCache = new Map<string, EmailMessageDetailSnapshot>();
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function fetchMessageDetail(
  messageId: string,
): Promise<EmailMessageDetail | null> {
  const res = await fetch(`/api/email/${encodeURIComponent(messageId)}`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const parsed = emailMessageDetailSchema.safeParse(await res.json());
  if (!parsed.success) return null;
  detailCache.set(messageId, parsed.data);
  return parsed.data;
}

function beginLoad(messageId: string) {
  if (detailCache.has(messageId) || inflight.has(messageId)) return;

  const request = fetchMessageDetail(messageId);
  inflight.set(messageId, request);

  request
    .then((data) => {
      if (!data) {
        errorCache.set(messageId, "Could not load message details.");
      }
    })
    .catch(() => {
      errorCache.set(messageId, "Could not load message details.");
    })
    .finally(() => {
      snapshotCache.delete(messageId);
      inflight.delete(messageId);
      notifyListeners();
    });

  snapshotCache.delete(messageId);
  notifyListeners();
}

export type EmailMessageDetailSnapshot = {
  detail: EmailMessageDetail | null;
  loading: boolean;
  error: string | null;
};

const EMPTY_SNAPSHOT: EmailMessageDetailSnapshot = {
  detail: null,
  loading: false,
  error: null,
};

function getSnapshot(activeId: string | undefined): EmailMessageDetailSnapshot {
  if (!activeId) return EMPTY_SNAPSHOT;

  const cached = snapshotCache.get(activeId);
  if (cached) return cached;

  const detail = detailCache.get(activeId);
  if (detail) {
    const snap: EmailMessageDetailSnapshot = { detail, loading: false, error: null };
    snapshotCache.set(activeId, snap);
    return snap;
  }

  const error = errorCache.get(activeId);
  if (error) {
    const snap: EmailMessageDetailSnapshot = { detail: null, loading: false, error };
    snapshotCache.set(activeId, snap);
    return snap;
  }

  const snap: EmailMessageDetailSnapshot = { detail: null, loading: true, error: null };
  snapshotCache.set(activeId, snap);
  return snap;
}

function subscribeForMessage(activeId: string | undefined, onStoreChange: () => void) {
  const unsubscribe = subscribe(onStoreChange);
  if (activeId) beginLoad(activeId);
  return unsubscribe;
}

export function useEmailMessageDetail(
  messageId: string | undefined,
): EmailMessageDetailSnapshot {
  const activeId = messageId?.trim() || undefined;

  return useSyncExternalStore(
    (onStoreChange) => subscribeForMessage(activeId, onStoreChange),
    () => getSnapshot(activeId),
    () => getSnapshot(activeId),
  );
}
