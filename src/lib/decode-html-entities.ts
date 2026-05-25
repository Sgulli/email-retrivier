const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": "\u00a0",
};

function decodeNumericEntity(dec: string, hex?: string): string {
  const code = hex ? Number.parseInt(hex, 16) : Number.parseInt(dec, 10);
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) {
    return hex ? `&#x${hex};` : `&#${dec};`;
  }
  try {
    return String.fromCodePoint(code);
  } catch {
    return hex ? `&#x${hex};` : `&#${dec};`;
  }
}

/** Gmail API snippets (and some headers) use HTML entity encoding. */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  let result = text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => decodeNumericEntity("", hex))
    .replace(/&#(\d+);/g, (_, dec) => decodeNumericEntity(dec));

  for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
    result = result.replaceAll(entity, char);
  }

  return result;
}
