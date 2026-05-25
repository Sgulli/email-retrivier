import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { MastraAgent } from "@ag-ui/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { mastra } from "@/mastra";
import type { EmailRequestContext } from "@/mastra/request-context";
import { getAuth } from "@/lib/auth-server";

const serviceAdapter = new ExperimentalEmptyAdapter();

export const POST = async (req: NextRequest) => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: req.headers });

  const requestContext: RequestContext<EmailRequestContext> | undefined =
    session
      ? new RequestContext<EmailRequestContext>([
          [
            "user",
            {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
            },
          ],
        ])
      : undefined;

  const agents = MastraAgent.getLocalAgents({
    mastra,
    resourceId: "emailAgent",
    // @ag-ui/mastra types requestContext as `unknown`; payload matches EmailRequestContext.
    requestContext: requestContext as RequestContext | undefined,
  });

  const runtime = new CopilotRuntime({ agents });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
