import type {
  Processor,
  ProcessLLMRequestArgs,
  ProcessLLMRequestResult,
} from "@mastra/core/processors";

type PromptMessage = ProcessLLMRequestArgs["prompt"][number];

type AssistantContent = Extract<PromptMessage, { role: "assistant" }>["content"];

export function isDeepSeekThinkingModel(
  model: ProcessLLMRequestArgs["model"],
): boolean {
  if (!("modelId" in model)) return false;
  const id = `${model.provider}/${model.modelId}`.toLowerCase();
  return id.includes("deepseek") && id.includes("v4");
}

/** Patches the outbound prompt so OpenAI-compatible adapters emit `reasoning_content`. */
export function patchDeepSeekThinkingPrompt(
  prompt: ProcessLLMRequestArgs["prompt"],
): ProcessLLMRequestArgs["prompt"] {
  return prompt.map(patchAssistantReasoning);
}

function patchAssistantReasoning(message: PromptMessage): PromptMessage {
  if (message.role !== "assistant" || !Array.isArray(message.content)) {
    return message;
  }

  const parts = message.content;
  const hasToolCall = parts.some((part) => part.type === "tool-call");
  if (!hasToolCall) return message;

  const hasReasoning = parts.some((part) => part.type === "reasoning");
  if (hasReasoning) return message;

  const reasoningPart = { type: "reasoning", text: "" } as const;
  const content = [reasoningPart, ...parts] as AssistantContent;

  return { ...message, content };
}

/**
 * DeepSeek V4 thinking mode requires prior assistant `reasoning_content` on every
 * turn after a tool call. The OpenAI-compatible adapter often omits it on replay;
 * inject an empty reasoning part so tool continuations (e.g. preview-email) do not 400.
 */
export class DeepSeekThinkingCompatProcessor implements Processor {
  readonly id = "deepseek-thinking-compat";
  readonly name = "DeepSeek thinking tool-call compat";
  readonly description =
    "Injects empty reasoning parts on assistant tool-call messages for DeepSeek V4 thinking mode.";

  processLLMRequest({
    prompt,
    model,
  }: ProcessLLMRequestArgs): ProcessLLMRequestResult {
    if (!isDeepSeekThinkingModel(model)) return;

    const patched = patchDeepSeekThinkingPrompt(prompt);
    const changed = patched.some((msg, i) => msg !== prompt[i]);
    if (!changed) return;

    return { prompt: patched };
  }
}
