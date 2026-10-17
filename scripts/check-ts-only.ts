import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DISALLOWED_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx", ".py"]);
const IGNORED_PREFIXES = ["node_modules/", "dist/", "coverage/"];

export function findDisallowedScriptFiles(files: readonly string[]): string[] {
  return files.filter((file) => {
    const normalized = file.replace(/\\/g, "/");
    if (IGNORED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      return false;
    }
    const ext = path.extname(normalized).toLowerCase();
    return DISALLOWED_EXTENSIONS.has(ext);
  });
}

export function listRepoFiles(cwd: string = process.cwd()): string[] {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd,
    encoding: "utf8",
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const disallowed = findDisallowedScriptFiles(listRepoFiles());
  if (disallowed.length > 0) {
    console.error(
      `Only TypeScript (.ts / .tsx) is allowed. Disallowed .js/.mjs/.cjs/.jsx/.py files found:\n${disallowed
        .map((file) => `  - ${file}`)
        .join("\n")}`,
    );
    process.exit(1);
  }
}
