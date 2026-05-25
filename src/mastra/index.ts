import { Mastra } from "@mastra/core";
import { emailAgent } from "./agents/email-agent";
import { LibSQLStore } from "@mastra/libsql";
import { getAuth } from "@/lib/auth-server";
import { MastraAuthBetterAuth } from "@mastra/auth-better-auth";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

async function createMastra() {
  const betterAuth = await getAuth();

  const auth = new MastraAuthBetterAuth({
    auth: betterAuth,
    public: ["/", "/api/auth/*", "/api/chat", "/api/download", "/api/email/*"],
    mapUserToResourceId: (authUser: { user: { id: string } }) =>
      authUser.user.id,
  });

  const dataDir = join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });

  return new Mastra({
    agents: { emailAgent },
    storage: new LibSQLStore({
      id: "mastra-storage",
      url: `file:${join(dataDir, "mastra.db")}`,
    }),
    server: { auth },
  });
}

export const mastra = await createMastra();
