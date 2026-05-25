export const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export const FIELDS_LABELS = "labels(id,name,type)";
export const FIELDS_MESSAGE =
  "id,threadId,snippet,payload/headers,internalDate";
export const FIELDS_MESSAGE_LIST_IDS =
  "messages(id),nextPageToken,resultSizeEstimate";
export const FIELDS_FULL_MESSAGE = "id,payload";

export const DEFAULT_SKIP_MIMES = ["text/calendar"];
