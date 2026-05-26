import { Mastra } from "@mastra/core";
import { emailAgent } from "./agents/email-agent";
import { LibSQLStore } from "@mastra/libsql";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

export const mastra = new Mastra({
  agents: { emailAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: `file:${join(dataDir, "mastra.db")}`,
  }),
});
