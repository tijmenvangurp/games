import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import stockfishPackage from "stockfish.js/package.json" with { type: "json" };

/** De asm.js-variant is een grote terugvaloptie; wij gebruiken de wasm-build. */
const SKIPPED_FILES = new Set(["stockfish.js"]);

/**
 * Kopieert de GPL-3.0 Stockfish-build uit `node_modules` naar de publieke map.
 * De bestanden worden niet gecommit: `.js`-assets vallen buiten de
 * TypeScript-regel en de wasm hoort bij de dependencyversie. De Vite-plugin
 * draait dit vóór de build en vóór de dev-server.
 */
export function copyStockfishAssets(publicDir: string): void {
  const require = createRequire(import.meta.url);

  let packageJsonPath: string;
  try {
    packageJsonPath = require.resolve("stockfish.js/package.json");
  } catch {
    return;
  }

  const sourceDir = dirname(packageJsonPath);
  const targetDir = join(resolve(publicDir), "stockfish");
  mkdirSync(targetDir, { recursive: true });

  const files = stockfishPackage.files.filter((file) => !SKIPPED_FILES.has(file));

  for (const file of files) {
    const source = join(sourceDir, file);

    if (existsSync(source)) {
      copyFileSync(source, join(targetDir, file));
    }
  }
}
