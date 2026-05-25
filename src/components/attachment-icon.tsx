"use client";

import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Code2,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Music,
  Presentation,
} from "lucide-react";
import {
  resolveAttachmentVisual,
  type AttachmentIconKind,
} from "@/lib/attachment-display";

const KIND_ICON: Record<AttachmentIconKind, LucideIcon> = {
  image: FileImage,
  pdf: FileText,
  video: FileVideo,
  audio: Music,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  presentation: Presentation,
  archive: Archive,
  code: Code2,
  file: File,
};

const KIND_STYLES: Record<AttachmentIconKind, string> = {
  image: "bg-violet-100 text-violet-700",
  pdf: "bg-red-100 text-red-700",
  video: "bg-fuchsia-100 text-fuchsia-700",
  audio: "bg-indigo-100 text-indigo-700",
  spreadsheet: "bg-emerald-100 text-emerald-700",
  document: "bg-blue-100 text-blue-700",
  presentation: "bg-orange-100 text-orange-700",
  archive: "bg-amber-100 text-amber-800",
  code: "bg-slate-200 text-slate-700",
  file: "bg-gray-100 text-gray-600",
};

export function AttachmentIcon({
  mimeType,
  filename,
  size = "md",
}: {
  mimeType: string;
  filename: string;
  size?: "sm" | "md";
}) {
  const { kind, label } = resolveAttachmentVisual(mimeType, filename);
  const Icon = KIND_ICON[kind];
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? 16 : 20;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${box} ${KIND_STYLES[kind]}`}
      title={label}
      aria-hidden
    >
      <Icon size={icon} strokeWidth={2} />
    </span>
  );
}
