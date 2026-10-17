import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const runtimeRoot = join(homedir(), ".local", "playwright-deps");
const libraryDirectory = join(runtimeRoot, "usr", "lib", "x86_64-linux-gnu");
const fontConfigDirectory = join(runtimeRoot, "etc", "fonts");
const environment = { ...process.env };

if (existsSync(libraryDirectory)) {
  environment.LD_LIBRARY_PATH = [libraryDirectory, process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(":");
}

if (existsSync(fontConfigDirectory)) {
  environment.FONTCONFIG_PATH = fontConfigDirectory;
}

const result = spawnSync(
  "corepack",
  ["pnpm", "exec", "playwright", "test", ...process.argv.slice(2)],
  {
    env: environment,
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
