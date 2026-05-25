import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  resolveAttachmentVisual,
} from "./attachment-display";

describe("formatFileSize", () => {
  it("formats bytes and KB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats MB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("resolveAttachmentVisual", () => {
  it("prefers MIME for images", () => {
    expect(resolveAttachmentVisual("image/png", "photo.bin").kind).toBe(
      "image",
    );
  });

  it("falls back to extension when MIME is generic", () => {
    expect(
      resolveAttachmentVisual("application/octet-stream", "report.pdf").kind,
    ).toBe("pdf");
  });

  it("detects spreadsheets by extension", () => {
    expect(
      resolveAttachmentVisual("application/octet-stream", "data.xlsx").kind,
    ).toBe("spreadsheet");
  });
});
