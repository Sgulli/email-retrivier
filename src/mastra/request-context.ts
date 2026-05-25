import type { ToolExecutionContext } from "@mastra/core/tools";
import { z } from "zod";

/** Matches `emailAgent.requestContextSchema` and CopilotKit `RequestContext` payload. */
export const emailRequestContextSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});

export type EmailRequestContext = z.infer<typeof emailRequestContextSchema>;

export type EmailToolContext = ToolExecutionContext<
  unknown,
  unknown,
  EmailRequestContext
>;

/** Spread into `createTool({ … })` for tools that require an authenticated user. */
export const emailToolRequestContext = {
  requestContextSchema: emailRequestContextSchema,
} as const;

export function getRequestUser(context: EmailToolContext) {
  const user = context.requestContext?.get("user");
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export function requireUserId(context: EmailToolContext): string {
  return getRequestUser(context).id;
}
