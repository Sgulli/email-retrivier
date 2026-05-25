import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "./decode-html-entities";

describe("decodeHtmlEntities", () => {
  it("decodes decimal apostrophe entities from Gmail snippets", () => {
    expect(
      decodeHtmlEntities(
        "Il Como vola in Europa dall&#39;ingresso principale.",
      ),
    ).toBe("Il Como vola in Europa dall'ingresso principale.");
  });

  it("decodes named and hex entities", () => {
    expect(decodeHtmlEntities("a &amp; b &lt;c&gt; &#x27;d")).toBe(
      "a & b <c> 'd",
    );
  });

  it("leaves plain text unchanged", () => {
    expect(decodeHtmlEntities("Ci sono stagioni destinate.")).toBe(
      "Ci sono stagioni destinate.",
    );
  });
});
