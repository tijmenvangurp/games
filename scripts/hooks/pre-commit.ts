import { spawnSync } from "node:child_process";

const result = spawnSync("corepack", ["pnpm", "run", "quality"], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
