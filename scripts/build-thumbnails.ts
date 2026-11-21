import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";
import { gameCatalog } from "../libs/entities/game/model/game-catalog.ts";

/**
 * Bouwt en controleert de lokale spelthumbnails.
 *
 * `pnpm run thumbnails --input <map>` verkleint elke afbeelding in die map naar
 * 800 × 500 JPEG, hernoemt hem met een contenthash en schrijft hem naar
 * `apps/games/public/thumbnails`. Daarna plak je het pad in `gameCatalog`.
 *
 * `pnpm run thumbnails:check` bewaakt de catalogus: elk pad bestaat, is
 * 800 × 500 en de contenthash in de bestandsnaam klopt met de inhoud. Er blijven
 * geen ongebruikte thumbnails achter.
 *
 * De prompts en de stijlafspraken staan in `docs/thumbnails.md`.
 */
const ASSET_DIR = "apps/games/public/thumbnails";
const WIDTH = 800;
const HEIGHT = 500;
const QUALITY = 84;
const HASH_LENGTH = 8;
const NAME_PATTERN = /^(?<slug>[a-z0-9-]+)-(?<hash>[0-9a-f]{8})\.jpg$/;

export function contentHash(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex").slice(0, HASH_LENGTH);
}

/** Splitst `sudoku-e4fcab84.jpg` in de slug en de contenthash. */
export function parseThumbnailName(file: string): { slug: string; hash: string } | null {
  const match = NAME_PATTERN.exec(file);
  return match?.groups ? { slug: match.groups.slug ?? "", hash: match.groups.hash ?? "" } : null;
}

interface RawInput {
  path: string;
  slug: string;
}

async function readInputs(directory: string): Promise<RawInput[]> {
  if (!existsSync(directory)) {
    throw new Error(`Map niet gevonden: ${directory}`);
  }

  const entries = await readdir(directory);
  return entries
    .filter((file) => [".jpg", ".jpeg", ".png", ".webp"].includes(extname(file).toLowerCase()))
    .map((file) => ({
      path: join(directory, file),
      slug: basename(file, extname(file)).toLowerCase(),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Verwijdert de oude bestanden van dezelfde slug, zodat er geen dode assets blijven. */
async function removeStale(slug: string, keep: string): Promise<void> {
  for (const file of await readdir(ASSET_DIR)) {
    if (file !== keep && parseThumbnailName(file)?.slug === slug) {
      await rm(join(ASSET_DIR, file));
    }
  }
}

async function generate(inputDirectory: string): Promise<void> {
  const inputs = await readInputs(inputDirectory);
  if (inputs.length === 0) {
    throw new Error(`Geen afbeeldingen gevonden in ${inputDirectory}`);
  }

  const written: { slug: string; path: string }[] = [];
  for (const input of inputs) {
    const jpeg = await sharp(input.path)
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();
    const file = `${input.slug}-${contentHash(jpeg)}.jpg`;
    await writeFile(join(ASSET_DIR, file), jpeg);
    await removeStale(input.slug, file);
    written.push({ slug: input.slug, path: `/thumbnails/${file}` });
  }

  console.log(`✓ ${written.length} thumbnails geschreven naar ${ASSET_DIR}`);
  for (const item of written) {
    console.log(`  ${item.slug.padEnd(18)} ${item.path}`);
  }
  console.log("\nZet het pad in gameCatalog bij de juiste game.");
}

interface Finding {
  message: string;
}

async function checkOne(thumbnail: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const file = basename(thumbnail);
  const parsed = parseThumbnailName(file);

  if (!parsed) {
    findings.push({ message: `${thumbnail}: naam moet <slug>-<8 hex>.jpg zijn` });
  }

  const absolute = join(ASSET_DIR, file);
  if (!existsSync(absolute)) {
    findings.push({ message: `${thumbnail}: bestand ontbreekt` });
    return findings;
  }

  const data = await readFile(absolute);
  if (parsed && parsed.hash !== contentHash(data)) {
    findings.push({ message: `${thumbnail}: contenthash klopt niet met de inhoud` });
  }

  const meta = await sharp(data).metadata();
  if (meta.width !== WIDTH || meta.height !== HEIGHT) {
    findings.push({
      message: `${thumbnail}: ${meta.width} × ${meta.height} in plaats van ${WIDTH} × ${HEIGHT}`,
    });
  }

  return findings;
}

async function check(): Promise<void> {
  const findings: Finding[] = [];
  const used = new Set<string>();

  for (const game of gameCatalog) {
    if (game.status !== "available") {
      continue;
    }
    used.add(basename(game.thumbnail));
    findings.push(
      ...(await checkOne(game.thumbnail).then((items) =>
        items.map((item) => ({ message: `${game.id} → ${item.message}` })),
      )),
    );
  }

  for (const file of await readdir(ASSET_DIR)) {
    if (file.endsWith(".jpg") && !used.has(file)) {
      findings.push({ message: `${file}: thumbnail hoort bij geen enkele game` });
    }
  }

  if (findings.length > 0) {
    console.error(`✗ ${findings.length} thumbnail-probleem(en):`);
    for (const finding of findings) {
      console.error(`  - ${finding.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const total = await stat(ASSET_DIR);
  console.log(`✓ ${used.size} thumbnails kloppen (${WIDTH} × ${HEIGHT}, contenthash)`);
  void total;
}

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
const isCheck = args.includes("--check");

if (isCheck) {
  await check();
} else if (inputIndex >= 0 && args[inputIndex + 1]) {
  await generate(args[inputIndex + 1]);
} else {
  console.error("Gebruik: pnpm run thumbnails --input <map> of pnpm run thumbnails:check");
  process.exitCode = 1;
}
