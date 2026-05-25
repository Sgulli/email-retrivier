import { describe, expect, it } from "vitest";
import {
  emailPreviewFieldsSchema,
  formatEmailDate,
  highlightSearchResultsSchema,
} from "./email-ui-schemas";

describe("formatEmailDate", () => {
  it("formats a Gmail internalDate ms timestamp", () => {
    const ms = new Date("2024-05-19T14:30:00Z").getTime().toString();
    const formatted = formatEmailDate(ms);
    expect(formatted).toMatch(/May/);
    expect(formatted).toMatch(/2024/);
  });

  it("returns fallback for missing date", () => {
    expect(formatEmailDate(undefined)).toBe("Unknown date");
  });
});

describe("highlightSearchResultsSchema", () => {
  it("requires at least one message", () => {
    const result = highlightSearchResultsSchema.safeParse({
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid highlight payload", () => {
    const result = highlightSearchResultsSchema.safeParse({
      query: "from:alice has:attachment",
      messages: [
        {
          id: "abc",
          subject: "Hi",
          from: "alice@example.com",
          snippet: "Hello",
          internalDate: "1710000000000",
        },
      ],
      focusIndex: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe("emailPreviewFieldsSchema", () => {
  it("requires messageId only", () => {
    const result = emailPreviewFieldsSchema.safeParse({
      messageId: "msg-1",
    });
    expect(result.success).toBe(true);
  });
});
