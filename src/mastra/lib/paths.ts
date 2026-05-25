import { join, dirname } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

function findProjectRoot(dir: string): string {
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  return dir;
}

const cwd = process.cwd();
const projectRoot = findProjectRoot(cwd);

export const DATA_DIR = join(projectRoot, "data");

mkdirSync(DATA_DIR, { recursive: true });
