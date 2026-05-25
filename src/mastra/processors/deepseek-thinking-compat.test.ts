import { describe, expect, it } from "vitest";
import { patchDeepSeekThinkingPrompt } from "./deepseek-thinking-compat";

describe("patchDeepSeekThinkingPrompt", () => {
  it("prepends empty reasoning when assistant message has tool-call but no reasoning", () => {
    const prompt = [
      { role: "user" as const, content: [{ type: "text" as const, text: "hi" }] },
      {
        role: "assistant" as const,
        content: [
          {
            type: "tool-call" as const,
            toolCallId: "call_1",
            toolName: "search-emails",
            input: { query: "from:me" },
          },
        ],
      },
    ];

    const patched = patchDeepSeekThinkingPrompt(prompt);
    const assistant = patched[1];
    expect(assistant?.role).toBe("assistant");
    if (assistant?.role === "assistant" && Array.isArray(assistant.content)) {
      expect(assistant.content[0]).toEqual({ type: "reasoning", text: "" });
      expect(assistant.content[1]?.type).toBe("tool-call");
    }
  });

  it("does not change assistant messages that already have reasoning", () => {
    const prompt = [
      {
        role: "assistant" as const,
        content: [
          { type: "reasoning" as const, text: "plan" },
          {
            type: "tool-call" as const,
            toolCallId: "call_1",
            toolName: "preview-email",
            input: { messageId: "abc" },
          },
        ],
      },
    ];

    expect(patchDeepSeekThinkingPrompt(prompt)).toEqual(prompt);
  });

  it("does not change assistant messages without tool calls", () => {
    const prompt = [
      {
        role: "assistant" as const,
        content: [{ type: "text" as const, text: "Hello" }],
      },
    ];

    expect(patchDeepSeekThinkingPrompt(prompt)).toEqual(prompt);
  });
});
