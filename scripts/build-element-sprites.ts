import { existsSync } from "node:fs";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { icons as fluentEmojiFlatIcons } from "@iconify-json/fluent-emoji-flat";
import { icons as phosphorIcons } from "@iconify-json/ph";
import { ELEMENTS } from "../libs/entities/alchemy/model/elements";
import type { ElementIconSource } from "./element-icons";
import { ELEMENT_ICONS } from "./element-icons";

/**
 * Builds the local element sprites for Mengelmoes from Iconify packages in
 * `node_modules`. No network access: every set is a dev dependency pinned in
 * `pnpm-lock.yaml`, so the output is reproducible and works offline.
 *
 * Run `pnpm run elements` to regenerate and `pnpm run elements:check` to verify
 * the committed SVG's without writing. The app only ever loads these local
 * files; the CSP stays `img-src 'self' data:`.
 *
 * Adding a set: `pnpm add -D @iconify-json/<prefix>`, add it to `SETS` below and
 * reference `<prefix>:<name>` in `scripts/element-icons.ts`.
 */
const ASSET_DIR = "apps/games/public/elements";

interface IconifyIcon {
  body: string;
  width?: number;
  height?: number;
}

interface IconifySet {
  width?: number;
  height?: number;
  icons: Record<string, IconifyIcon>;
}

const SETS: Readonly<Record<string, IconifySet>> = {
  "fluent-emoji-flat": fluentEmojiFlatIcons,
  ph: phosphorIcons,
};

interface FoundIcon {
  icon: IconifyIcon;
  set: IconifySet;
}

function splitReference(reference: string): [prefix: string, name: string] {
  const separator = reference.indexOf(":");
  if (separator <= 0 || separator === reference.length - 1) {
    throw new Error(`Ongeldige icoonreferentie: ${reference}`);
  }
  return [reference.slice(0, separator), reference.slice(separator + 1)];
}

function findIcon(source: { icons: readonly string[] }): FoundIcon | null {
  for (const reference of source.icons) {
    const [prefix, name] = splitReference(reference);
    const set = SETS[prefix];
    if (!set) {
      throw new Error(`Onbekende iconset: ${prefix}. Voeg @iconify-json/${prefix} toe.`);
    }

    const icon = set.icons[name];
    if (icon) {
      return { icon, set };
    }
  }

  return null;
}

function dimension(value: number | undefined, fallback: number | undefined): number {
  return value ?? fallback ?? 32;
}

function serializeIcon(icon: IconifyIcon, set: IconifySet, color?: string): string {
  const width = dimension(icon.width, set.width);
  const height = dimension(icon.height, set.height);
  const body = color ? icon.body.replaceAll("currentColor", color) : icon.body;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

function renderIcon(id: string, source: ElementIconSource): string {
  if ("custom" in source) {
    throw new Error(`${id} is een handmatig icoon en wordt niet gegenereerd`);
  }

  const found = findIcon(source);
  if (!found) {
    throw new Error(`${id}: geen icoon gevonden in ${source.icons.join(", ")}`);
  }

  return serializeIcon(found.icon, found.set, source.color);
}

function checkManifest(): void {
  const elementIds = new Set(ELEMENTS.map((element) => element.id));
  const missing = [...elementIds].filter((id) => !(id in ELEMENT_ICONS));
  const unknown = Object.keys(ELEMENT_ICONS).filter((id) => !elementIds.has(id));
  const problems: string[] = [];

  if (missing.length > 0) {
    problems.push(`Geen icoon voor: ${missing.join(", ")}`);
  }
  if (unknown.length > 0) {
    problems.push(`Icoon zonder element: ${unknown.join(", ")}`);
  }
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }
}

function buildExpected(): Map<string, string | null> {
  const expected = new Map<string, string | null>();

  for (const [id, source] of Object.entries(ELEMENT_ICONS)) {
    expected.set(id, "custom" in source ? null : renderIcon(id, source));
  }

  return expected;
}

async function staleAssets(expected: ReadonlyMap<string, string | null>): Promise<string[]> {
  const files = (await readdir(ASSET_DIR)).filter((file) => file.endsWith(".svg"));
  return files
    .map((file) => file.slice(0, -".svg".length))
    .filter((id) => !expected.has(id))
    .map((id) => join(ASSET_DIR, `${id}.svg`));
}

async function checkEntry(id: string, expectedContent: string | null): Promise<string | null> {
  const file = join(ASSET_DIR, `${id}.svg`);
  if (!existsSync(file)) {
    return `Ontbreekt: ${file}`;
  }

  if (expectedContent === null) {
    return null;
  }

  const actual = await readFile(file, "utf8");
  return actual === expectedContent ? null : `Verouderd: ${file}`;
}

async function check(expected: ReadonlyMap<string, string | null>): Promise<void> {
  const entryProblems = await Promise.all(
    [...expected].map(([id, content]) => checkEntry(id, content)),
  );
  const problems = entryProblems.filter((problem): problem is string => problem !== null);

  for (const file of await staleAssets(expected)) {
    problems.push(`Onbekend bestand: ${file}`);
  }

  if (problems.length > 0) {
    throw new Error(
      `De elementiconen kloppen niet:\n${problems.join("\n")}\n\nDraai \`pnpm run elements\`.`,
    );
  }

  console.log(`✓ ${expected.size} elementiconen kloppen.`);
}

async function removeStale(expected: ReadonlyMap<string, string | null>): Promise<void> {
  for (const file of await staleAssets(expected)) {
    await rm(file);
    console.log(`- ${file} verwijderd`);
  }
}

async function generate(expected: ReadonlyMap<string, string | null>): Promise<void> {
  let written = 0;

  for (const [id, content] of expected) {
    const file = join(ASSET_DIR, `${id}.svg`);
    if (content === null) {
      if (!existsSync(file)) {
        throw new Error(`Ontbreekt (handmatig icoon): ${file}`);
      }
      continue;
    }

    await writeFile(file, content, "utf8");
    written += 1;
  }

  await removeStale(expected);
  console.log(`✓ ${written} elementiconen geschreven, ${expected.size - written} handmatig.`);
}

checkManifest();
const expected = buildExpected();

if (process.argv.includes("--check")) {
  await check(expected);
} else {
  await generate(expected);
}
