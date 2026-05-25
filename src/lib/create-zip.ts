import archiver from "archiver";

export interface ZipEntry {
  name: string;
  buffer: Buffer;
}

/**
 * Build an in-memory ZIP archive from the provided entries.
 *
 * Throws if `entries` is empty (callers should treat that as a 502 / no-op
 * upstream and respond accordingly).
 *
 * Implementation note: the archive is collected into memory because the
 * route handler returns the full byte stream in one Response. For very
 * large archives, prefer a streaming response via the archiver's stream.
 */
export async function createZipFromBuffers(
  entries: readonly ZipEntry[],
): Promise<Buffer> {
  if (entries.length === 0) {
    throw new Error("createZipFromBuffers: at least one entry is required");
  }

  return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const parts: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => parts.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(parts)));
    archive.on("error", (err) => reject(err));

    for (const entry of entries) {
      archive.append(entry.buffer, { name: entry.name });
    }

    archive.finalize();
  });
}
