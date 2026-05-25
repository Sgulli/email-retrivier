<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## CopilotChat layout

Do **not** wrap or restyle `CopilotChat` (see `.cursor/rules/copilotchat-layout.mdc`). Keep `className="flex-1 w-full"` on `src/app/page.tsx`. Put modals, highlight panels, and other UI on fixed overlays or in-chat tool renderers — never in a flex row/column with the chat.

## Effect (Mastra / API boundaries)

Use helpers from `src/mastra/run-app.ts` at tool/route edges — not `Effect.provide`, `Effect.flatMap(Service, …)`, or bare `Effect.runPromise`.

| Use case | Helper |
|----------|--------|
| Mastra tool + DB | `withDbUser(ctx, (userId, db) => …)` |
| Mastra tool + Gmail | `withGmailUser(ctx, (userId, gmail) => …)` |
| Mastra tool + attachments | `withAttachmentsUser(ctx, (attachments) => …)` |
| Mastra tool + multiple app services | `withAppUser(ctx, () => Effect.gen(…))` |
| Next route + Gmail | `withGmail(userId, (gmail) => …)` |
| DB only (no auth context) | `withDb((db) => …)` — use `Effect.gen` inside for multi-step |

Map DB rows to tool output with pure helpers in `src/mastra/lib/db-results.ts` (e.g. `foundUser`, `gmailAuthStatus`).

**Typed request context:** define once in `src/mastra/request-context.ts` (`emailRequestContextSchema`). Spread `emailToolRequestContext` into each authenticated `createTool`. In `execute`, use `requireUserId(context)` or `context.requestContext?.get("user")` — no casts. Set values with `new RequestContext<EmailRequestContext>([['user', { id, name, email }]])` at the API boundary.

**DeepSeek V4 + tools:** keep `DeepSeekThinkingCompatProcessor` on `emailAgent` while using `opencode-go/deepseek-v4-flash`. It patches outbound prompts via `processLLMRequest` so tool-call turns include a reasoning part (adapter → `reasoning_content`). If errors persist, start a new chat thread or switch to a non-thinking model.

**Download UI:** `browser-download` must not render `DownloadPanel` per tool-call bubble (CopilotKit replays tool turns → duplicate buttons). `EmailToolRenderers` updates `downloadReady` in `EmailUiProvider`; `DownloadReadyPanel` is the only ZIP UI (`fixed` overlay sibling of `CopilotChat`).
