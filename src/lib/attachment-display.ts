export type AttachmentIconKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "spreadsheet"
  | "document"
  | "presentation"
  | "archive"
  | "code"
  | "file";

export interface AttachmentVisual {
  kind: AttachmentIconKind;
  label: string;
}

const EXT_KIND: Record<string, AttachmentIconKind> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  heic: "image",
  mp4: "video",
  mov: "video",
  webm: "video",
  mkv: "video",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  ogg: "audio",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  csv: "spreadsheet",
  ods: "spreadsheet",
  doc: "document",
  docx: "document",
  txt: "document",
  rtf: "document",
  md: "document",
  ppt: "presentation",
  pptx: "presentation",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  json: "code",
  xml: "code",
  html: "code",
  js: "code",
  ts: "code",
};

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(filename: string): string {
  const base = filename.trim().split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
}

function kindFromMime(mime: string): AttachmentIconKind | null {
  const m = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (
    m.includes("spreadsheet") ||
    m.includes("excel") ||
    m === "text/csv"
  ) {
    return "spreadsheet";
  }
  if (
    m.includes("word") ||
    m.startsWith("text/") ||
    m === "application/rtf"
  ) {
    return "document";
  }
  if (m.includes("presentation") || m.includes("powerpoint")) {
    return "presentation";
  }
  if (
    m.includes("zip") ||
    m.includes("compressed") ||
    m.includes("archive") ||
    m === "application/x-rar-compressed" ||
    m === "application/x-7z-compressed"
  ) {
    return "archive";
  }
  if (
    m.includes("json") ||
    m.includes("javascript") ||
    m.includes("xml") ||
    m.includes("typescript")
  ) {
    return "code";
  }
  return null;
}

const KIND_LABEL: Record<AttachmentIconKind, string> = {
  image: "Image",
  pdf: "PDF",
  video: "Video",
  audio: "Audio",
  spreadsheet: "Spreadsheet",
  document: "Document",
  presentation: "Presentation",
  archive: "Archive",
  code: "Code",
  file: "File",
};

/** Resolve icon kind and short label from MIME type and filename. */
export function resolveAttachmentVisual(
  mimeType: string,
  filename: string,
): AttachmentVisual {
  const fromMime = kindFromMime(mimeType);
  const ext = extensionOf(filename);
  const fromExt = ext ? EXT_KIND[ext] : undefined;
  const kind = fromMime ?? fromExt ?? "file";
  return { kind, label: KIND_LABEL[kind] };
}
