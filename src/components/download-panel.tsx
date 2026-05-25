"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FileInfo {
  filename: string;
  size: number;
  objectName: string;
  presignedUrl?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTotalSize(files: FileInfo[]) {
  return files.reduce((sum, f) => sum + f.size, 0);
}

async function downloadZip(files: FileInfo[]) {
  const hasObjectNames = files.some((f) => f.objectName);
  if (!hasObjectNames) throw new Error("No files available for ZIP download");

  const response = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      files: files.map((f) => ({
        objectName: f.objectName,
        filename: f.filename,
      })),
    }),
  });

  if (!response.ok) throw new Error("Failed to create ZIP");

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = "attachments.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export function DownloadPanel({ files }: { files: FileInfo[] }) {
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  const handleZipDownload = async () => {
    setZipping(true);
    setZipError(null);
    try {
      await downloadZip(files);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to create ZIP";
      console.error("Failed to download ZIP", error);
      setZipError(msg);
    } finally {
      setZipping(false);
    }
  };

  return (
    <Card size="sm" className="my-2">
      <CardHeader>
        <CardTitle>
          {files.length} file{files.length > 1 ? "s" : ""} ready to download{" "}
          <span className="text-muted-foreground font-normal">
            ({formatSize(getTotalSize(files))})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button onClick={handleZipDownload} disabled={zipping} className="w-full">
          {zipping ? "Creating archive..." : "Download ZIP"}
        </Button>
        {zipError && (
          <p className="text-xs text-destructive">{zipError}</p>
        )}
      </CardContent>
      {files.some((f) => f.presignedUrl) && (
        <>
          <Separator />
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">Or download individually:</p>
            <div className="flex flex-wrap gap-1.5">
              {files.map((f, i) =>
                f.presignedUrl ? (
                  <a
                    key={i}
                    href={f.presignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                  >
                    {f.filename}
                  </a>
                ) : null,
              )}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
