import { describe, expect, it } from "vitest";
import { createZipFromBuffers } from "./create-zip";

const ZIP_LOCAL_FILE_HEADER_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const ZIP_END_OF_CENTRAL_DIR_MAGIC = Buffer.from([0x50, 0x4b, 0x05, 0x06]);

describe("createZipFromBuffers", () => {
  it("throws when the entry list is empty", async () => {
    await expect(createZipFromBuffers([])).rejects.toThrow(
      /at least one entry is required/,
    );
  });

  it("produces a non-empty buffer with the ZIP magic bytes for one file", async () => {
    const entries = [{ name: "hello.txt", buffer: Buffer.from("hello world") }];
    const zip = await createZipFromBuffers(entries);

    expect(zip.length).toBeGreaterThan(0);
    expect(zip.subarray(0, 4)).toEqual(ZIP_LOCAL_FILE_HEADER_MAGIC);
    expect(zip.includes(ZIP_END_OF_CENTRAL_DIR_MAGIC)).toBe(true);
  });

  it("includes each entry's filename in the archive bytes", async () => {
    const entries = [
      { name: "alpha.txt", buffer: Buffer.from("AAA") },
      { name: "beta.txt", buffer: Buffer.from("BBB") },
      { name: "gamma.txt", buffer: Buffer.from("CCC") },
    ];
    const zip = await createZipFromBuffers(entries);

    for (const entry of entries) {
      expect(zip.includes(entry.name)).toBe(true);
    }
  });

  it("survives entries with duplicate filenames (archiver dedupes silently)", async () => {
    const entries = [
      { name: "dup.txt", buffer: Buffer.from("first") },
      { name: "dup.txt", buffer: Buffer.from("second") },
    ];
    const zip = await createZipFromBuffers(entries);
    expect(zip.length).toBeGreaterThan(0);
    expect(zip.subarray(0, 4)).toEqual(ZIP_LOCAL_FILE_HEADER_MAGIC);
  });

  it("handles a binary payload (non-ASCII bytes)", async () => {
    const binary = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
    const zip = await createZipFromBuffers([
      { name: "blob.bin", buffer: binary },
    ]);

    expect(zip.length).toBeGreaterThan(binary.length);
    expect(zip.subarray(0, 4)).toEqual(ZIP_LOCAL_FILE_HEADER_MAGIC);
    expect(zip.includes("blob.bin")).toBe(true);
  });
});
