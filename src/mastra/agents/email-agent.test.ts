import { describe, expect, it } from "vitest";
import { EMAIL_AGENT_TOOLS } from "./email-agent";

/**
 * Mastra exposes tools to the LLM under the *object key* in the tools map,
 * not the tool's `id`. The CopilotKit frontend renderer is registered with
 * `useRenderTool({ name: "browser-download" })`, so the keys here must be
 * kebab-case and match the prompt instructions and the renderer name.
 *
 * If this test fails, the in-chat Download ZIP button will silently stop
 * appearing — see the regression that prompted these tests.
 */
describe("EMAIL_AGENT_TOOLS", () => {
  it("exposes browser-download under the kebab-case key the renderer expects", () => {
    expect(EMAIL_AGENT_TOOLS).toHaveProperty("browser-download");
  });

  it("uses kebab-case keys (no camelCase / no PascalCase)", () => {
    for (const key of Object.keys(EMAIL_AGENT_TOOLS)) {
      expect(key).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(key).not.toMatch(/[A-Z]/);
    }
  });

  it("each key matches its tool's id (single source of truth)", () => {
    for (const [key, tool] of Object.entries(EMAIL_AGENT_TOOLS)) {
      const id = (tool as { id?: string }).id;
      expect(id).toBe(key);
    }
  });

  it("includes every tool the system prompt references", () => {
    const required = [
      "search-emails",
      "get-message",
      "get-latest-email",
      "browser-download",
    ];
    for (const name of required) {
      expect(EMAIL_AGENT_TOOLS).toHaveProperty(name);
    }
  });
});
