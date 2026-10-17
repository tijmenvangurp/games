import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Athena has no system browser libraries. The user-local Playwright runtime
// provides them; child processes inherit these paths on other machines too.
const runtimeRoot = join(homedir(), ".local", "playwright-deps");
const libraryDirectory = join(runtimeRoot, "usr", "lib", "x86_64-linux-gnu");
const fontConfigDirectory = join(runtimeRoot, "etc", "fonts");

if (existsSync(libraryDirectory)) {
  process.env.LD_LIBRARY_PATH = [libraryDirectory, process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(":");
}
if (existsSync(fontConfigDirectory)) {
  process.env.FONTCONFIG_PATH = fontConfigDirectory;
}

const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#f6f4ee" />
  <rect x="11" y="11" width="19" height="19" rx="5" fill="#38bdf8" />
  <rect x="34" y="11" width="19" height="19" rx="5" fill="#fbbf24" />
  <rect x="11" y="34" width="19" height="19" rx="5" fill="#34d399" />
  <rect x="34" y="34" width="19" height="19" rx="5" fill="#fb7185" />
</svg>`;

const TARGETS = [
  { file: "icon-512.png", size: 512 },
  { file: "icon-192.png", size: 192 },
  { file: "apple-touch-icon.png", size: 180 },
];

const browser = await chromium.launch();

for (const target of TARGETS) {
  const page = await browser.newPage({
    viewport: { width: target.size, height: target.size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:#f6f4ee}svg{display:block}</style></head><body>${ICON_SVG}</body></html>`,
  );
  await page.screenshot({ path: `apps/games/public/${target.file}` });
  await page.close();
  console.log(`wrote apps/games/public/${target.file} (${target.size}x${target.size})`);
}

await browser.close();
