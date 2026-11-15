import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Snijdt de prenten bij de gebeurtenisvakjes uit het Ganzenbordbord.
 *
 * De uitsneden staan in procenten van `board.webp`. Ze zijn met de hand
 * gekalibreerd rond de prent bij het vak; `CELL_POINTS` in
 * `libs/features/ganzenbord/model/board-points.ts` geeft het middelpunt van
 * het vak zelf. Prenten boven de evenaar van het bord staan ondersteboven en
 * worden daarom 180° gedraaid; de brug ligt dwars en draait 90° terug.
 *
 * Run `pnpm run ganzenbord:art` om opnieuw te snijden en
 * `pnpm run ganzenbord:art:check` om te controleren zonder te schrijven.
 */
const BOARD = "apps/games/public/ganzenbord/board.webp";
const OUT_DIR = "apps/games/public/ganzenbord/events";
const MANIFEST = join(OUT_DIR, "manifest.json");
const MAX_SIZE = 240;

interface CropBox {
  /** Linkerkant in procenten van de bordbreedte. */
  readonly x1: number;
  /** Bovenkant in procenten van de bordhoogte. */
  readonly y1: number;
  /** Rechterkant in procenten van de bordbreedte. */
  readonly x2: number;
  /** Onderkant in procenten van de bordhoogte. */
  readonly y2: number;
}

interface EventArtSpec {
  readonly id: string;
  readonly box: CropBox;
  /** Draaiing in graden met de klok mee; 0 laat de prent zoals hij staat. */
  readonly rotate: number;
}

const SPECS: readonly EventArtSpec[] = [
  { id: "goose", box: { x1: 58.9, y1: 67.3, x2: 65.8, y2: 74.6 }, rotate: 0 },
  { id: "bridge", box: { x1: 11.1, y1: 68.8, x2: 15.8, y2: 77.5 }, rotate: -90 },
  { id: "inn", box: { x1: 84.0, y1: 61.2, x2: 90.8, y2: 69.4 }, rotate: 0 },
  { id: "well", box: { x1: 33.9, y1: 9.4, x2: 40.8, y2: 18.1 }, rotate: 180 },
  { id: "maze", box: { x1: 36.4, y1: 67.2, x2: 42.6, y2: 76.3 }, rotate: 0 },
  { id: "prison", box: { x1: 72.5, y1: 26.5, x2: 79.4, y2: 34.3 }, rotate: 180 },
  { id: "death", box: { x1: 34.3, y1: 26.6, x2: 39.6, y2: 33.3 }, rotate: 180 },
  { id: "treasure", box: { x1: 41.0, y1: 45.5, x2: 53.5, y2: 60.5 }, rotate: 0 },
];

interface ManifestEntry {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

interface Manifest {
  readonly board: string;
  readonly crops: readonly ManifestEntry[];
}

function hash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function render(spec: EventArtSpec, board: Buffer, width: number, height: number) {
  const left = Math.round((spec.box.x1 / 100) * width);
  const top = Math.round((spec.box.y1 / 100) * height);
  const cropWidth = Math.round(((spec.box.x2 - spec.box.x1) / 100) * width);
  const cropHeight = Math.round(((spec.box.y2 - spec.box.y1) / 100) * height);

  // Eerst los uitsnijden, daarna pas draaien: sharp voert `rotate` vóór
  // `extract` uit als ze in dezelfde pipeline staan, waardoor de uitsnede
  // anders komt te liggen.
  const raw = await sharp(board)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();

  return sharp(raw)
    .rotate(spec.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(MAX_SIZE, MAX_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toBuffer({ resolveWithObject: true });
}

async function build(): Promise<void> {
  const board = await readFile(BOARD);
  const metadata = await sharp(board).metadata();
  const width = metadata.width;
  const height = metadata.height;
  if (!width || !height) {
    throw new Error(`Kan de afmetingen van ${BOARD} niet lezen.`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const crops: ManifestEntry[] = [];

  for (const spec of SPECS) {
    const { data, info } = await render(spec, board, width, height);
    const file = `${spec.id}.webp`;
    await writeFile(join(OUT_DIR, file), data);
    crops.push({ file, width: info.width, height: info.height, sha256: hash(data) });
    console.log(`✓ ${file} (${info.width}×${info.height})`);
  }

  const manifest: Manifest = { board: hash(board), crops };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ ${crops.length} prenten en manifest geschreven.`);
}

async function check(): Promise<void> {
  const expected = JSON.parse(await readFile(MANIFEST, "utf8")) as Manifest;
  const board = await readFile(BOARD);
  const boardProblem =
    expected.board !== hash(board) ? [`${BOARD} is gewijzigd; snijd de prenten opnieuw.`] : [];
  const fileProblems = await Promise.all(
    expected.crops.map(async (entry) => {
      const file = join(OUT_DIR, entry.file);
      if (!existsSync(file)) {
        return `Ontbreekt: ${file}`;
      }
      const data = await readFile(file);
      return hash(data) !== entry.sha256 ? `Verouderd: ${file}` : null;
    }),
  );
  const problems = [
    ...boardProblem,
    ...fileProblems.filter((problem): problem is string => problem !== null),
  ];

  if (problems.length > 0) {
    throw new Error(
      `De Ganzenbordprenten kloppen niet:\n${problems.join("\n")}\n\nDraai \`pnpm run ganzenbord:art\`.`,
    );
  }

  console.log(`✓ ${expected.crops.length} Ganzenbordprenten kloppen.`);
}

if (process.argv.includes("--check")) {
  await check();
} else {
  await build();
}
