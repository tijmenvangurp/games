import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listRepoFiles } from "./check-ts-only.ts";

const IGNORED_PREFIXES = ["node_modules/", "dist/", "coverage/"];
const IMPORTANT_PATTERN = /!\s*important\b/i;
const COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;

export interface ImportantHit {
  file: string;
  line: number;
  text: string;
}

/** Finds `!important` declarations, ignoring anything inside CSS comments. */
export function findImportantStyles(
  sources: readonly { file: string; source: string }[],
): ImportantHit[] {
  const hits: ImportantHit[] = [];

  for (const { file, source } of sources) {
    // Blank out comments while keeping newlines so line numbers stay correct.
    const linePreserving = source.replace(COMMENT_PATTERN, (match) => match.replace(/[^\n]/g, " "));

    linePreserving.split("\n").forEach((line, index) => {
      if (IMPORTANT_PATTERN.test(line)) {
        hits.push({ file, line: index + 1, text: line.trim() });
      }
    });
  }

  return hits;
}

export function listStylesheets(files: readonly string[]): string[] {
  return files
    .map((file) => file.replace(/\\/g, "/"))
    .filter(
      (file) =>
        file.endsWith(".css") && !IGNORED_PREFIXES.some((prefix) => file.startsWith(prefix)),
    );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sources = listStylesheets(listRepoFiles()).map((file) => ({
    file,
    source: readFileSync(file, "utf8"),
  }));
  const hits = findImportantStyles(sources);

  if (hits.length > 0) {
    console.error(
      [
        "!important is not allowed in CSS. Reach for a cascade layer (@layer) or a more specific selector instead:",
        ...hits.map((hit) => `  - ${hit.file}:${hit.line}: ${hit.text}`),
      ].join("\n"),
    );
    process.exit(1);
  }
}
