import { spawnSync } from "node:child_process";

const messageFile = process.argv[2];

if (!messageFile) {
  throw new Error("Expected Git to provide a commit message file");
}

const result = spawnSync("corepack", ["pnpm", "exec", "commitlint", "--edit", messageFile], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
