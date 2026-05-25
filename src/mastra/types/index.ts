export interface OAuthClientBlock {
  client_id: string;
  project_id: string;
  auth_uri: string;
  token_uri: string;
  client_secret: string;
  redirect_uris: string[];
}

export interface GoogleClientSecrets {
  installed?: OAuthClientBlock;
  web?: OAuthClientBlock;
}

export interface SavedToken {
  type: "authorized_user";
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  subject: string;
  from: string;
}

export interface FetchMessagesOptions {
  maxResults?: number;
  pageToken?: string;
  query?: string;
  labelIds?: string[];
}

export interface FetchMessagesResult {
  messages: GmailMessage[];
  nextPageToken?: string | null;
  resultSizeEstimate: number;
}

export interface AttachmentMeta {
  partId: string;
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
  inline: boolean;
}

export interface DownloadResult {
  attachmentId: string;
  filename: string;
  savedPath: string;
  size: number;
}

export interface AttachmentServiceOptions {
  maxSizeBytes?: number;
  includeInline?: boolean;
}

export type NodeErrorCode =
  | "EEXIST"
  | "ENOENT"
  | "EACCES"
  | "EPERM"
  | "ENOTDIR"
  | "EISDIR"
  | "ENOTEMPTY"
  | "EBUSY"
  | "EMFILE"
  | "ENFILE"
  | "EBADF"
  | "ECONNREFUSED"
  | "ECONNRESET"
  | "ETIMEDOUT"
  | "EADDRINUSE"
  | "EADDRNOTAVAIL";

export interface OAuthKey {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  auth_uri?: string;
  token_uri?: string;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

import type { Auth } from "better-auth";
import type { MastraAuthProvider } from "@mastra/core/server";

export interface AuthResult {
  auth: Auth;
  mastraAuth?: MastraAuthProvider;
}
