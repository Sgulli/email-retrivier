import { describe, expect, it } from "vitest";
import { parseDownloadResult } from "./parse-download-result";

describe("parseDownloadResult", () => {
  it("returns null when input is undefined", () => {
    expect(parseDownloadResult(undefined)).toBeNull();
  });

  it("returns null when input is empty string", () => {
    expect(parseDownloadResult("")).toBeNull();
  });

  it("returns null when input is not valid JSON", () => {
    expect(parseDownloadResult("not json")).toBeNull();
    expect(parseDownloadResult("{invalid")).toBeNull();
  });

  it("returns null when downloadLinks entries fail schema validation", () => {
    expect(
      parseDownloadResult(
        JSON.stringify({ downloadLinks: [{ filename: 123 }] }),
      ),
    ).toBeNull();
    expect(
      parseDownloadResult(
        JSON.stringify({
          downloadLinks: [
            { filename: "x.pdf", size: "not-a-number", objectName: "abc" },
          ],
        }),
      ),
    ).toBeNull();
  });

  it("returns null when the top-level value is not an object", () => {
    expect(parseDownloadResult(JSON.stringify(["array"]))).toBeNull();
    expect(parseDownloadResult(JSON.stringify("string"))).toBeNull();
    expect(parseDownloadResult(JSON.stringify(42))).toBeNull();
    expect(parseDownloadResult(JSON.stringify(null))).toBeNull();
  });

  it("returns an empty array when downloadLinks is missing (default)", () => {
    expect(parseDownloadResult(JSON.stringify({}))).toEqual([]);
  });

  it("returns an empty array when downloadLinks is an empty list", () => {
    expect(parseDownloadResult(JSON.stringify({ downloadLinks: [] }))).toEqual(
      [],
    );
  });

  it("parses a single valid download link", () => {
    const raw = JSON.stringify({
      downloadLinks: [
        {
          filename: "report.pdf",
          size: 12345,
          objectName: "uuid/report.pdf",
          presignedUrl: "https://example.com/signed?x=1",
        },
      ],
    });

    expect(parseDownloadResult(raw)).toEqual([
      {
        filename: "report.pdf",
        size: 12345,
        objectName: "uuid/report.pdf",
        presignedUrl: "https://example.com/signed?x=1",
      },
    ]);
  });

  it("accepts entries without a presignedUrl", () => {
    const raw = JSON.stringify({
      downloadLinks: [
        {
          filename: "image.png",
          size: 999,
          objectName: "uuid/image.png",
        },
      ],
    });

    const links = parseDownloadResult(raw);
    expect(links).not.toBeNull();
    expect(links).toHaveLength(1);
    expect(links?.[0]?.presignedUrl).toBeUndefined();
  });

  it("parses multiple entries in order", () => {
    const raw = JSON.stringify({
      downloadLinks: [
        { filename: "a.txt", size: 1, objectName: "uuid/a.txt" },
        { filename: "b.txt", size: 2, objectName: "uuid/b.txt" },
        { filename: "c.txt", size: 3, objectName: "uuid/c.txt" },
      ],
    });

    const links = parseDownloadResult(raw);
    expect(links?.map((l) => l.filename)).toEqual(["a.txt", "b.txt", "c.txt"]);
  });
});
