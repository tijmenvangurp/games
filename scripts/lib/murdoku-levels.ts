import { readFile } from "node:fs/promises";
import { format } from "oxfmt";
import { MURDOKU_CASE_SPECS } from "../../libs/entities/murdoku/model/cases/specs";
import type { MurdokuCaseSpec } from "../../libs/entities/murdoku/model/cases/specs";
import {
  checkMurdokuLevel,
  generateMurdokuLevel,
  MURDOKU_ROOM_TINTS,
  placementOf,
  validateMurdokuCases,
  VICTIM_ID,
  type Cell,
  type LevelJson,
  type MurdokuCase,
  type PersonId,
} from "../../libs/entities/murdoku/index";
/**
 * Bouwt de twaalf eigen zaken van Wie was het? en controleert ze.
 *
 * De generator van de MIT-engine levert alleen de vorm van het bord en de
 * aanwijzingen als keys. Dit bestand zet daar eigen Nederlandse kamers, namen,
 * titels en intro's op. Er wordt geen levelbestand uit de MIT-repo of uit de
 * Murdoku-boeken gebruikt: elke zaak komt uit een vaste seed.
 */

export interface GeneratedMurdokuCase {
  id: string;
  level: LevelJson;
  solution: Record<PersonId, Cell>;
}

export interface GeneratedMurdokuLevels {
  version: 1;
  cases: GeneratedMurdokuCase[];
}

export const MURDOKU_LEVELS_FILE = "libs/entities/murdoku/model/cases/levels.json";

/**
 * De aanwijzingstypes die v1 toestaat.
 *
 * De lijst dekt de v1-woordenschat uit de spec: plaats, object, raam, hoek,
 * kamer, rij, kolom, alleen, de enige op een object, links/rechts/boven/onder
 * en "niet". Aanwijzingen op geslacht, baard, bril of ander uiterlijk staan er
 * bewust niet in; die zijn voor v1 te moeilijk en te persoonsgebonden. De
 * samengestelde vormen `and`, `or` en `not` combineren alleen toegestane
 * aanwijzingen.
 */
const V1_CLUE_TYPES: ReadonlySet<string> = new Set([
  "onObject",
  "nearObject",
  "nearObjectAny",
  "nearWindow",
  "nearDoor",
  "inside",
  "outside",
  "inRoom",
  "inRow",
  "inCol",
  "corner",
  "atWall",
  "uniqueOnObject",
  "uniqueNearObject",
  "uniqueNearWindow",
  "uniqueNearDoor",
  "uniqueInside",
  "uniqueOutside",
  "alone",
  "notAlone",
  "direction",
  "sameRoom",
  "sameLineAsObject",
  "directionFromObject",
  "sameRoomAsObject",
  "besideSameObject",
  "roomExists",
  "countOnObject",
  "emptyRooms",
  "everyRoomCount",
  "and",
  "or",
  "not",
]);

/** Alleen de vier kompasrichtingen; diagonalen zijn in v1 te lastig. */
const V1_DIRECTIONS: ReadonlySet<string> = new Set(["north", "south", "east", "west"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Eén aanwijzing tegen de v1-allowlist; leeg betekent: toegestaan. */
function clueProblems(value: unknown): string[] {
  if (!isRecord(value) || typeof value.type !== "string") {
    return ["een aanwijzing zonder type"];
  }
  const type = value.type;
  if (type === "and" || type === "or") {
    const children = Array.isArray(value.clues) ? value.clues : [];
    return children.flatMap(clueProblems);
  }
  if (type === "not") {
    return clueProblems(value.clue);
  }
  return [
    ...allowedTypeProblems(type),
    ...attributeProblems(type, value),
    ...directionProblems(type, value),
  ];
}

/** Het type zelf moet in de allowlist staan. */
function allowedTypeProblems(type: string): string[] {
  return V1_CLUE_TYPES.has(type) ? [] : [`${type} staat niet in de v1-allowlist`];
}

/** Aanwijzingen op een persoonskenmerk zijn in v1 te moeilijk. */
function attributeProblems(type: string, value: Record<string, unknown>): string[] {
  if (type === "roomExists" && (value.attribute != null || value.person != null)) {
    return ["roomExists met een persoonskenmerk staat niet in de v1-allowlist"];
  }
  if (type === "besideSameObject" && isRecord(value.mate) && value.mate.kind === "attr") {
    return ["besideSameObject met een persoonskenmerk staat niet in de v1-allowlist"];
  }
  return [];
}

/** Alleen de vier kompasrichtingen; diagonalen zijn in v1 te lastig. */
function directionProblems(type: string, value: Record<string, unknown>): string[] {
  if (typeof value.dir !== "string" || V1_DIRECTIONS.has(value.dir)) return [];
  return [`${type} gebruikt de diagonaal ${value.dir}`];
}

/**
 * Controleert alle aanwijzingen van een zaak tegen de v1-allowlist. Retourneert
 * leesbare problemen; een lege lijst betekent: toegestaan.
 */
export function murdokuV1ClueProblems(
  level: Pick<LevelJson, "suspects" | "globalClues" | "boardClues">,
): string[] {
  const clues = [
    ...level.suspects.flatMap((suspect) => suspect.clues ?? []),
    ...(level.globalClues ?? []),
    ...(level.boardClues ?? []),
  ];
  return clues.flatMap(clueProblems);
}

/** Vaste kamertinten; dezelfde waarden als de bordpalette van de feature. */

const INDOOR_ROOMS = [
  "room.keuken",
  "room.gang",
  "room.woonkamer",
  "room.slaapkamer",
  "room.badkamer",
  "room.eetkamer",
  "room.studeerkamer",
  "room.kinderkamer",
  "room.hal",
  "room.zolder",
  "room.kelder",
  "room.washok",
  "room.berging",
  "room.overloop",
] as const;

const OUTDOOR_ROOMS = [
  "room.tuin",
  "room.garage",
  "room.binnenplaats",
  "room.schuur",
  "room.serre",
  "room.balkon",
] as const;

const FEMALE_NAMES = [
  "Anna",
  "Britt",
  "Cato",
  "Eva",
  "Fien",
  "Hanna",
  "Iris",
  "Juna",
  "Lotte",
  "Mila",
  "Noor",
  "Roos",
  "Saar",
  "Tess",
  "Yara",
  "Nina",
] as const;

const MALE_NAMES = [
  "Bram",
  "Daan",
  "Finn",
  "Gijs",
  "Hugo",
  "Jens",
  "Lars",
  "Mees",
  "Noud",
  "Otis",
  "Pim",
  "Sem",
  "Teun",
  "Tim",
  "Wout",
  "Abel",
] as const;

/** Vaste, ruime budgetten: de generator mag nooit op wandkloktijd stoppen. */
const GENERATION_BUDGET = {
  maxAttempts: 40,
  softMs: 60_000,
  hardMs: 120_000,
} as const;

function genderOf(attributes: Record<string, unknown> | undefined): "f" | "m" {
  return attributes?.gender === "m" ? "m" : "f";
}

function nextName(
  pool: readonly string[],
  start: number,
  used: Set<string>,
  fallback: string,
): string {
  for (let step = 0; step < pool.length; step += 1) {
    const name = pool[(start + step) % pool.length];
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  used.add(fallback);
  return fallback;
}

function localizeRooms(level: LevelJson, caseIndex: number): void {
  const insideStart = caseIndex * 2;
  const outsideStart = caseIndex;
  let inside = 0;
  let outside = 0;

  for (const [index, room] of Object.values(level.rooms).entries()) {
    const pool = room.outside ? OUTDOOR_ROOMS : INDOOR_ROOMS;
    const offset = room.outside ? outsideStart + outside : insideStart + inside;
    room.nameKey = pool[offset % pool.length];
    room.color = MURDOKU_ROOM_TINTS[index % MURDOKU_ROOM_TINTS.length];
    if (room.outside) {
      outside += 1;
    } else {
      inside += 1;
    }
  }
}

function localizePeople(level: LevelJson, spec: MurdokuCaseSpec, caseIndex: number): void {
  const used = new Set<string>();

  level.suspects.forEach((suspect, index) => {
    const gender = genderOf(suspect.attributes);
    const pool = gender === "m" ? MALE_NAMES : FEMALE_NAMES;
    const start = caseIndex * 3 + index;
    suspect.name = nextName(pool, start, used, `${suspect.id}${index}`);
  });

  const victimGender = genderOf(level.victim.attributes);
  level.victim.name = victimGender === "m" ? spec.victimName.male : spec.victimName.female;
}

function pruneObjects(level: LevelJson): void {
  if (!level.objects) return;
  const used = new Set<string>();
  for (const row of [...(level.groundMap ?? []), ...(level.topMap ?? [])]) {
    for (const char of row) {
      if (char !== ".") used.add(char);
    }
  }
  level.objects = Object.fromEntries(
    Object.entries(level.objects).filter(([char]) => used.has(char)),
  );
}

function buildCase(spec: MurdokuCaseSpec, caseIndex: number): GeneratedMurdokuCase {
  const generated = generateMurdokuLevel({
    width: spec.width,
    height: spec.height,
    suspects: spec.suspects,
    seed: spec.seed,
    themeId: spec.themeId,
    difficulty: spec.difficulty,
    budget: GENERATION_BUDGET,
  });
  const level = structuredClone(generated);

  level.id = spec.id;
  level.title = spec.title;
  delete level.author;
  delete level.titles;

  localizeRooms(level, caseIndex);
  localizePeople(level, spec, caseIndex);
  pruneObjects(level);

  const clueProblems = murdokuV1ClueProblems(level);
  if (clueProblems.length > 0) {
    throw new Error(
      `${spec.id} gebruikt aanwijzingen die v1 niet toestaat:\n  ${clueProblems.join("\n  ")}`,
    );
  }

  const check = checkMurdokuLevel(level, { forwardOnly: true });
  if (!check.unique || !check.solvable || !check.solution) {
    throw new Error(
      `${spec.id} is niet uniek en vooruit oplosbaar (unique=${check.unique}, solvable=${check.solvable})`,
    );
  }

  const solution: Record<PersonId, Cell> = {};
  const actual = placementOf(check.solution);
  for (const suspect of level.suspects) {
    const cell = actual.get(suspect.id);
    if (cell === undefined) throw new Error(`${spec.id} mist een oplossing voor ${suspect.id}`);
    solution[suspect.id] = cell;
  }
  const victimCell = actual.get(VICTIM_ID);
  if (victimCell === undefined) throw new Error(`${spec.id} mist het vakje van het slachtoffer`);
  solution.victim = victimCell;

  return { id: spec.id, level, solution };
}

function toMurdokuCases(data: GeneratedMurdokuLevels): MurdokuCase[] {
  const byId = new Map(data.cases.map((entry) => [entry.id, entry]));
  return MURDOKU_CASE_SPECS.flatMap((spec) => {
    const generated = byId.get(spec.id);
    if (!generated) return [];
    return [
      {
        id: spec.id,
        title: spec.title,
        intro: spec.intro,
        level: generated.level,
        solution: generated.solution,
      },
    ];
  });
}

/** Bouwt alle zaken opnieuw en controleert ze met dezelfde poort als de app. */
export function buildMurdokuLevels(): GeneratedMurdokuLevels {
  const data: GeneratedMurdokuLevels = {
    version: 1,
    cases: MURDOKU_CASE_SPECS.map((spec, index) => buildCase(spec, index)),
  };

  const problems = validateMurdokuCases(toMurdokuCases(data));
  if (problems.length > 0) {
    throw new Error(`De gegenereerde zaken kloppen niet:\n  ${problems.join("\n  ")}`);
  }
  return data;
}

/** JSON met gesorteerde sleutels, zodat opmaak geen valse drift oplevert. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareCases(expected: GeneratedMurdokuLevels, actual: GeneratedMurdokuLevels): string[] {
  const problems: string[] = [];
  if (actual.version !== expected.version) {
    problems.push(`de bestandsversie is ${actual.version} in plaats van ${expected.version}`);
  }

  const expectedIds = expected.cases.map((entry) => entry.id);
  const actualIds = actual.cases.map((entry) => entry.id);
  if (expectedIds.join(",") !== actualIds.join(",")) {
    problems.push("de zaken of hun volgorde wijken af van de vaste lijst");
  }

  const byId = new Map(actual.cases.map((entry) => [entry.id, entry]));
  for (const entry of expected.cases) {
    const found = byId.get(entry.id);
    if (!found) {
      problems.push(`${entry.id} ontbreekt`);
    } else if (canonical(found) !== canonical(entry)) {
      problems.push(`${entry.id} wijkt af; draai \`pnpm run murdoku:levels\``);
    }
  }
  return problems;
}

async function readLevelsFile(file: string): Promise<GeneratedMurdokuLevels> {
  const raw = JSON.parse(await readFile(file, "utf8")) as Partial<GeneratedMurdokuLevels>;
  if (raw.version !== 1 || !Array.isArray(raw.cases)) {
    throw new Error(`${file} heeft niet de vorm van een zakenbestand`);
  }
  return raw as GeneratedMurdokuLevels;
}

/**
 * De `--check`-stand: controleert het gecommitte bestand tegen een verse
 * generatie en tegen alle zaakinvarianten. Geeft leesbare problemen terug.
 */
export async function checkMurdokuLevelsFile(file = MURDOKU_LEVELS_FILE): Promise<string[]> {
  let expected: GeneratedMurdokuLevels;
  try {
    expected = buildMurdokuLevels();
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  let actual: GeneratedMurdokuLevels;
  try {
    actual = await readLevelsFile(file);
  } catch (error) {
    return [`${file} is niet leesbaar: ${error instanceof Error ? error.message : String(error)}`];
  }

  try {
    const problems = validateMurdokuCases(toMurdokuCases(actual));
    if (problems.length > 0) return problems;
  } catch (error) {
    return [
      `de zaken zijn niet te laden: ${error instanceof Error ? error.message : String(error)}`,
    ];
  }

  const clueProblems = actual.cases.flatMap((entry) =>
    murdokuV1ClueProblems(entry.level).map((problem) => `${entry.id}: ${problem}`),
  );
  if (clueProblems.length > 0) return clueProblems;

  return compareCases(expected, actual);
}

/** Schrijft het bestand in de vorm die de app importeert, met de repo-opmaak. */
export async function renderMurdokuLevels(data: GeneratedMurdokuLevels): Promise<string> {
  const result = await format(MURDOKU_LEVELS_FILE, `${JSON.stringify(data, null, 2)}\n`);
  if (result.errors.length > 0) {
    throw new Error(`De zaken-JSON is niet te formatteren: ${result.errors[0]?.message ?? "?"}`);
  }
  return result.code.endsWith("\n") ? result.code : `${result.code}\n`;
}
