/**
 * Genereert `puzzles-extra.ts` uit de Lichess-puzzeldatabase (CC0).
 *
 * Vereist de `zstd`-CLI in `PATH`, of zet `ZSTD_BIN` naar het binary. Dit
 * script draait alleen offline; de uitvoer wordt gecommit en CI heeft geen
 * netwerk- of database-toegang nodig.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { Chess, type Move, type PieceSymbol } from "chess.js";
import { parseUci } from "../libs/features/chess-puzzles/model/puzzle-engine";
import type {
  ChessPuzzle,
  PuzzleDifficulty,
  PuzzleKind,
} from "../libs/features/chess-puzzles/model/types";

// De generator is een eenmalige offline datatool. De complexiteitsregels van de
// app zijn hier niet zinvol; Fallow negeert de complexiteit per functie.
const DATABASE_URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst";
const CORE_FILE = "libs/features/chess-puzzles/model/puzzles.ts";
const OUTPUT_FILE = "libs/features/chess-puzzles/model/puzzles-extra.ts";
const TARGET_PER_TIER = 30;
const MAX_PER_BUCKET = 40;
const MIN_POPULARITY = 85;
const MIN_NB_PLAYS = 500;
const PIECES: readonly PieceSymbol[] = ["p", "n", "b", "r", "q"];
const TACTIC_THEMES = new Set([
  "discoveredAttack",
  "fork",
  "hangingPiece",
  "pin",
  "sacrifice",
  "skewer",
]);

interface Candidate {
  readonly id: string;
  readonly kind: PuzzleKind;
  readonly difficulty: PuzzleDifficulty;
  readonly fen: string;
  readonly moves: readonly string[];
  readonly rating: number;
  readonly popularity: number;
  readonly nbPlays: number;
  readonly themes: readonly string[];
  readonly gameUrl: string;
  readonly finalPiece: PieceSymbol;
}

interface Analysis {
  readonly kind: PuzzleKind;
  readonly finalPiece: PieceSymbol;
}

interface PlayedLine {
  readonly chess: Chess;
  readonly finalPiece: PieceSymbol | null;
  readonly lastMove: Move | null;
}

interface RawPuzzleFields {
  readonly id: string;
  readonly fen: string;
  readonly movesRaw: string;
  readonly ratingRaw: string;
  readonly popularityRaw: string;
  readonly nbPlaysRaw: string;
  readonly themesRaw: string;
  readonly gameUrl: string;
}

function parseArgs(): { readonly dryRun: boolean; readonly maxLines: number } {
  const maxLinesArg = process.argv.find((argument) => argument.startsWith("--max-lines="));
  const maxLines = maxLinesArg ? Number(maxLinesArg.split("=")[1]) : 0;

  return {
    dryRun: process.argv.includes("--dry-run"),
    maxLines: Number.isFinite(maxLines) ? maxLines : 0,
  };
}

function isMateTheme(themes: readonly string[]): boolean {
  return themes.includes("mateIn1") || themes.includes("mateIn2");
}

function isTacticTheme(themes: readonly string[]): boolean {
  return themes.some((theme) => TACTIC_THEMES.has(theme));
}

// fallow-ignore-next-line complexity
function playLine(fen: string, moves: readonly string[]): PlayedLine | null {
  const chess = new Chess(fen);
  const setup = moves[0];

  if (!setup) {
    return null;
  }

  try {
    chess.move(parseUci(setup));
  } catch {
    return null;
  }

  let finalPiece: PieceSymbol | null = null;
  let lastMove: Move | null = null;

  for (let index = 1; index < moves.length; index += 1) {
    const uci = moves[index];
    if (!uci) {
      return null;
    }

    const parsed = parseUci(uci);
    const piece = chess.get(parsed.from);
    if (!piece) {
      return null;
    }

    try {
      const move = chess.move(parsed);
      if (index === moves.length - 1) {
        finalPiece = piece.type;
        lastMove = move;
      }
    } catch {
      return null;
    }
  }

  return { chess, finalPiece, lastMove };
}

function classify(chess: Chess, lastMove: Move): PuzzleKind {
  if (chess.isCheckmate()) {
    return "mate";
  }

  return lastMove.captured ? "capture" : "tactic";
}

// fallow-ignore-next-line complexity
function analyze(
  fen: string,
  moves: readonly string[],
  themes: readonly string[],
): Analysis | null {
  if (moves.length !== 2 && moves.length !== 4) {
    return null;
  }

  const line = playLine(fen, moves);
  if (!line || !line.finalPiece || !line.lastMove) {
    return null;
  }

  if (isMateTheme(themes) && !line.chess.isCheckmate()) {
    return null;
  }

  if (themes.includes("hangingPiece") && !line.lastMove.captured) {
    return null;
  }

  return {
    kind: classify(line.chess, line.lastMove),
    finalPiece: line.finalPiece,
  };
}

// fallow-ignore-next-line complexity
function ratingTier(rating: number): PuzzleDifficulty | null {
  if (rating < 400 || rating > 1600) {
    return null;
  }

  if (rating <= 800) {
    return "easy";
  }

  if (rating <= 1200) {
    return "medium";
  }

  return "hard";
}

// fallow-ignore-next-line complexity
function difficultyFor(
  rating: number,
  moves: readonly string[],
  themes: readonly string[],
): PuzzleDifficulty | null {
  const tier = ratingTier(rating);
  if (!tier) {
    return null;
  }

  if (tier === "easy") {
    return moves.length === 2 && (themes.includes("mateIn1") || themes.includes("hangingPiece"))
      ? "easy"
      : null;
  }

  return moves.length === 4 && (themes.includes("mateIn2") || isTacticTheme(themes)) ? tier : null;
}

function candidateScore(candidate: Candidate): number {
  return candidate.popularity * 1_000_000 + candidate.nbPlays;
}

function sortCandidates(a: Candidate, b: Candidate): number {
  return candidateScore(b) - candidateScore(a) || a.rating - b.rating || a.id.localeCompare(b.id);
}

function addCandidate(
  buckets: Map<string, Candidate[]>,
  candidate: Candidate,
  seen: Set<string>,
): void {
  if (seen.has(candidate.id)) {
    return;
  }

  const key = `${candidate.difficulty}:${candidate.finalPiece}`;
  const bucket = buckets.get(key) ?? [];
  bucket.push(candidate);
  bucket.sort(sortCandidates);
  seen.add(candidate.id);

  if (bucket.length > MAX_PER_BUCKET) {
    bucket.length = MAX_PER_BUCKET;
  }

  buckets.set(key, bucket);
}

// fallow-ignore-next-line complexity
function selectTier(
  buckets: Map<string, Candidate[]>,
  difficulty: PuzzleDifficulty,
): readonly Candidate[] {
  const chosen: Candidate[] = [];
  const used = new Set<string>();
  const counts = new Map<PieceSymbol, number>();
  const perPiece = Math.ceil(TARGET_PER_TIER / PIECES.length);

  for (const piece of PIECES) {
    for (const candidate of buckets.get(`${difficulty}:${piece}`) ?? []) {
      if (chosen.length >= TARGET_PER_TIER || (counts.get(piece) ?? 0) >= perPiece) {
        break;
      }
      if (used.has(candidate.id)) {
        continue;
      }

      chosen.push(candidate);
      used.add(candidate.id);
      counts.set(piece, (counts.get(piece) ?? 0) + 1);
    }
  }

  fillTier(buckets, difficulty, chosen, used);

  return chosen.sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id));
}

function fillTier(
  buckets: Map<string, Candidate[]>,
  difficulty: PuzzleDifficulty,
  chosen: Candidate[],
  used: Set<string>,
): void {
  if (chosen.length >= TARGET_PER_TIER) {
    return;
  }

  const rest = PIECES.flatMap((piece) => buckets.get(`${difficulty}:${piece}`) ?? [])
    .filter((candidate) => !used.has(candidate.id))
    .sort(sortCandidates);

  for (const candidate of rest) {
    if (chosen.length >= TARGET_PER_TIER) {
      break;
    }

    chosen.push(candidate);
    used.add(candidate.id);
  }
}

function selectCandidates(buckets: Map<string, Candidate[]>): readonly Candidate[] {
  return (["easy", "medium", "hard"] as const).flatMap((difficulty) =>
    selectTier(buckets, difficulty),
  );
}

function toPuzzle(candidate: Candidate): ChessPuzzle {
  return {
    id: candidate.id,
    kind: candidate.kind,
    difficulty: candidate.difficulty,
    fen: candidate.fen,
    moves: candidate.moves,
    rating: candidate.rating,
    themes: candidate.themes,
    gameUrl: candidate.gameUrl,
  };
}

function renderFile(puzzles: readonly ChessPuzzle[]): string {
  return `import type { ChessPuzzle } from "./types";

/**
 * Aanvullende Lichess-puzzels (CC0), gegenereerd met
 * \`scripts/generate-chess-puzzles.ts\` uit \`lichess_db_puzzle.csv.zst\`.
 *
 * Selectie: rating 400–1600, popularity ≥ 85, minimaal 500 partijen, twee of
 * vier halve zetten en een oplossing die met chess.js is gecontroleerd. Per
 * niveau zijn de stukken zoveel mogelijk gespreid over pion, paard, loper,
 * toren en dame.
 */
export const EXTRA_PUZZLES = ${JSON.stringify(puzzles, null, 2)} as const satisfies readonly ChessPuzzle[];
`;
}

// fallow-ignore-next-line complexity
function rawPuzzleFromLine(line: string): RawPuzzleFields | null {
  const fields = line.split(",");
  if (fields.length < 9) {
    return null;
  }

  const [id, fen, movesRaw, ratingRaw, , popularityRaw, nbPlaysRaw, themesRaw, gameUrl] = fields;
  const parsed: RawPuzzleFields = {
    id: id ?? "",
    fen: fen ?? "",
    movesRaw: movesRaw ?? "",
    ratingRaw: ratingRaw ?? "",
    popularityRaw: popularityRaw ?? "",
    nbPlaysRaw: nbPlaysRaw ?? "",
    themesRaw: themesRaw ?? "",
    gameUrl: gameUrl ?? "",
  };

  return Object.values(parsed).some((value) => value === "") ? null : parsed;
}

// fallow-ignore-next-line complexity
function candidateFromLine(line: string, coreIds: ReadonlySet<string>): Candidate | null {
  const fields = rawPuzzleFromLine(line);
  if (!fields || coreIds.has(fields.id)) {
    return null;
  }

  const rating = Number(fields.ratingRaw);
  const popularity = Number(fields.popularityRaw);
  const nbPlays = Number(fields.nbPlaysRaw);
  if (![rating, popularity, nbPlays].every(Number.isFinite)) {
    return null;
  }

  if (popularity < MIN_POPULARITY || nbPlays < MIN_NB_PLAYS) {
    return null;
  }

  const moves = fields.movesRaw.split(" ");
  const themes = fields.themesRaw.split(" ");
  const difficulty = difficultyFor(rating, moves, themes);
  if (!difficulty) {
    return null;
  }

  const analysis = analyze(fields.fen, moves, themes);
  if (!analysis) {
    return null;
  }

  return {
    id: fields.id,
    kind: analysis.kind,
    difficulty,
    fen: fields.fen,
    moves,
    rating,
    popularity,
    nbPlays,
    themes,
    gameUrl: fields.gameUrl,
    finalPiece: analysis.finalPiece,
  };
}

function readCoreIds(): ReadonlySet<string> {
  return new Set(
    [...readFileSync(CORE_FILE, "utf8").matchAll(/id: "([^"]+)"/g)]
      .map((match) => match[1])
      .filter((id): id is string => Boolean(id)),
  );
}

// fallow-ignore-next-line complexity
async function main(): Promise<void> {
  const { dryRun, maxLines } = parseArgs();

  if (!process.cwd().endsWith("shiny-rocket") && !process.cwd().endsWith("games")) {
    console.warn("Draai dit script vanuit de repository-root.");
  }

  const coreIds = readCoreIds();
  console.log(`Lichess-database downloaden… (${coreIds.size} bestaande puzzels overslaan)`);

  const response = await fetch(DATABASE_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Download mislukt: HTTP ${response.status}`);
  }

  const zstdBin = process.env.ZSTD_BIN ?? "zstd";
  const zstd = spawn(zstdBin, ["-dc"], { stdio: ["pipe", "pipe", "inherit"] });
  Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]).pipe(zstd.stdin);
  const lines = createInterface({ input: zstd.stdout, crlfDelay: Infinity });
  const buckets = new Map<string, Candidate[]>();
  const seen = new Set<string>();
  let firstLine = true;
  let lineCount = 0;
  let matched = 0;
  let aborted = false;

  zstd.on("error", (error: unknown) => {
    if (aborted) {
      return;
    }

    console.error("Kon de zstd-CLI niet starten. Installeer zstd of zet ZSTD_BIN.", error);
    process.exitCode = 1;
  });

  zstd.stdin.on("error", (error: unknown) => {
    if (aborted) {
      return;
    }

    console.error("Zstd-invoerfout:", error);
    process.exitCode = 1;
  });

  for await (const line of lines) {
    lineCount += 1;

    if (maxLines > 0 && lineCount > maxLines) {
      aborted = true;
      zstd.kill();
      break;
    }

    if (lineCount % 250_000 === 0) {
      console.log(`  ${lineCount.toLocaleString("nl-NL")} regels, ${matched} kandidaten`);
    }

    if (firstLine) {
      firstLine = false;
      continue;
    }

    const candidate = candidateFromLine(line, coreIds);
    if (!candidate) {
      continue;
    }

    addCandidate(buckets, candidate, seen);
    matched += 1;
  }

  const selected = selectCandidates(buckets);
  console.log(
    `Klaar: ${lineCount.toLocaleString("nl-NL")} regels, ${matched} kandidaten, ${selected.length} geselecteerd.`,
  );

  if (aborted) {
    console.error("Gestopt na --max-lines; bestand niet geschreven.");
    return;
  }

  if (process.exitCode) {
    console.error("De download of selectie is niet volledig; bestand niet geschreven.");
    return;
  }

  if (dryRun) {
    for (const puzzle of selected) {
      console.log(puzzle.difficulty, puzzle.kind, puzzle.rating, puzzle.id, puzzle.moves.join(" "));
    }
    return;
  }

  writeFileSync(OUTPUT_FILE, renderFile(selected.map(toPuzzle)), "utf8");
  console.log(`Geschreven naar ${OUTPUT_FILE}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
