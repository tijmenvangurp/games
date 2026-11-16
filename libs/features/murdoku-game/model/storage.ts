import { clampLevelIndex, type AdaptiveState, type Attempt } from "@entities/adaptive";
import {
  MURDOKU_CASES,
  MURDOKU_LADDER,
  VICTIM_ID,
  loadMurdokuLevel,
  murdokuCaseById,
  type Cell,
  type Explanation,
  type MurdokuLine,
  type PersonId,
  type Puzzle,
} from "@entities/murdoku";
import { isFiniteNumber, isNonNegativeInteger, isRecord } from "@shared/lib";
import { MURDOKU_INTRO_LEVEL } from "../lib/intro-level";
import type { MurdokuHintStage, MurdokuHintState } from "./hints";
import type { MurdokuPlayState } from "./play";
import { DEFAULT_MURDOKU_SETTINGS, type MurdokuSettings } from "./settings";

/** De opslagsleutel van Wie was het?; de route heet `/mysterie`. */
const STORAGE_KEY = "games.mysterie.v2";

/** De sleutel uit #125; die wordt eenmalig naar versie 2 gemigreerd. */
const LEGACY_STORAGE_KEY = "games.mysterie.v1";

/**
 * Versie van de opgeslagen vorm. Versie 0 is de schets uit de onderzoeksnotitie
 * (`marks` in plaats van `crosses`, nog geen hintstand); versie 1 is de vorm
 * zonder adaptief niveau en pogingen. Beide worden bij het lezen gemigreerd.
 */
const STORAGE_VERSION = 2;

/** Profielen volgen met ADR 0012; tot die tijd is er één lokaal profiel. */
const PROFILE_ID = "local";

/** Groter dan dit is geen echte opslag van dit spel; dan liever schoon beginnen. */
const MAX_STORED_CHARS = 32_000;

/** Het log is begrensd zodat localStorage niet volloopt (ADR 0026). */
export const MAX_STORED_ATTEMPTS = 200;

const MAX_CELLS = 36;
const MAX_HINTS_USED = 999;
const MAX_HINT_DEPTH = 4;
const MAX_HINT_PARAMS = 24;
const MAX_ITEM_ID_CHARS = 64;

const HINT_STAGES: ReadonlySet<string> = new Set<MurdokuHintStage>([
  "focus",
  "cross",
  "place",
  "check",
  "none",
]);

const CASE_IDS: ReadonlySet<string> = new Set(MURDOKU_CASES.map((entry) => entry.id));

export interface StoredMurdokuResolution {
  murdererId: PersonId;
  victimCell: Cell;
  roomId: string;
}

/** De lopende zaak zoals die in localStorage staat. */
export interface StoredMurdokuCurrent {
  levelId: string;
  placements: Record<PersonId, Cell>;
  crosses: Cell[];
  selected: PersonId | null;
  mode: "place" | "cross";
  phase: "playing" | "solved";
  resolution: StoredMurdokuResolution | null;
  hintsUsed: number;
  hint: MurdokuHintState | null;
}

export interface StoredMurdokuState {
  version: number;
  /** Tot de profielen uit ADR 0012 komt: één lokaal profiel. */
  profileId: string;
  current: StoredMurdokuCurrent | null;
  solved: string[];
  settings: MurdokuSettings;
  adaptive: AdaptiveState;
  attempts: readonly Attempt[];
}

/** Wat de store aan de opslag geeft; de opslag kiest de vorm en de grenzen. */
export interface MurdokuSaveInput {
  play: MurdokuPlayState | null;
  hint: MurdokuHintState | null;
  hintsUsed: number;
  solvedCaseIds: ReadonlySet<string>;
  settings: MurdokuSettings;
  adaptive: AdaptiveState;
  attempts: readonly Attempt[];
}

/** De staat zoals de store hem na het laden nodig heeft. */
export interface MurdokuRestoredState {
  puzzle: Puzzle | null;
  play: MurdokuPlayState | null;
  hint: MurdokuHintState | null;
  hintsUsed: number;
  solvedCaseIds: ReadonlySet<string>;
  settings: MurdokuSettings;
  adaptive: AdaptiveState;
  attempts: readonly Attempt[];
}

/** De beginstand van de adaptieve ladder: de kleinste zaak. */
const DEFAULT_MURDOKU_ADAPTIVE: AdaptiveState = {
  levelIndex: 0,
  streak: 0,
};

function emptyMurdokuState(): StoredMurdokuState {
  return {
    version: STORAGE_VERSION,
    profileId: PROFILE_ID,
    current: null,
    solved: [],
    settings: DEFAULT_MURDOKU_SETTINGS,
    adaptive: DEFAULT_MURDOKU_ADAPTIVE,
    attempts: [],
  };
}

/** De vaste zaak of de instapzaak die bij een levelId hoort. */
function puzzleForLevelId(levelId: string): Puzzle | null {
  if (levelId === MURDOKU_INTRO_LEVEL.id) {
    return loadMurdokuLevel(MURDOKU_INTRO_LEVEL);
  }
  const entry = murdokuCaseById(levelId);
  return entry ? loadMurdokuLevel(entry.level) : null;
}

function readSettings(value: unknown): MurdokuSettings {
  if (!isRecord(value)) {
    return DEFAULT_MURDOKU_SETTINGS;
  }
  return {
    autoCross: value.autoCross !== false,
  };
}

function readSolved(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && CASE_IDS.has(item)) {
      seen.add(item);
    }
  }
  return [...seen].slice(0, MURDOKU_CASES.length);
}

function readAdaptive(value: unknown): AdaptiveState {
  if (!isRecord(value)) {
    return DEFAULT_MURDOKU_ADAPTIVE;
  }
  const levelIndex = isNonNegativeInteger(value.levelIndex)
    ? clampLevelIndex(value.levelIndex, MURDOKU_LADDER.length)
    : DEFAULT_MURDOKU_ADAPTIVE.levelIndex;
  const streak = isNonNegativeInteger(value.streak) ? value.streak : 0;
  return { levelIndex, streak };
}

function isAttempt(value: unknown): value is Attempt {
  return (
    isRecord(value) &&
    typeof value.itemId === "string" &&
    value.itemId.length > 0 &&
    value.itemId.length <= MAX_ITEM_ID_CHARS &&
    typeof value.ok === "boolean" &&
    isFiniteNumber(value.at) &&
    isNonNegativeInteger(value.durationMs) &&
    isNonNegativeInteger(value.hints)
  );
}

/** Alleen geldige pogingen, in speelvolgorde, met een vaste bovengrens. */
function readAttempts(value: unknown): Attempt[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isAttempt).slice(-MAX_STORED_ATTEMPTS);
}

function readCell(value: unknown, cellCount: number): Cell | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < cellCount
    ? value
    : null;
}

/** Unieke, geldige vakjes in de volgorde van de opslag. */
function readCells(value: unknown, cellCount: number): Cell[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<Cell>();
  for (const item of value) {
    const cell = readCell(item, cellCount);
    if (cell !== null) {
      seen.add(cell);
    }
  }
  return [...seen].slice(0, cellCount);
}

function readPlacements(
  value: unknown,
  puzzle: Puzzle,
  includeVictim: boolean,
): Record<PersonId, Cell> {
  if (!isRecord(value)) {
    return {};
  }
  const cellCount = puzzle.board.width * puzzle.board.height;
  const people = new Set<PersonId>(puzzle.suspects.map((suspect) => suspect.id));
  if (includeVictim) {
    people.add(VICTIM_ID);
  }

  const placements: Record<PersonId, Cell> = {};
  const taken = new Set<Cell>();
  for (const [person, rawCell] of Object.entries(value)) {
    const cell = readCell(rawCell, cellCount);
    if (!people.has(person) || cell === null || taken.has(cell)) {
      continue;
    }
    if (!puzzle.board.isOccupiable(cell)) {
      continue;
    }
    placements[person] = cell;
    taken.add(cell);
  }
  return placements;
}

function readResolution(value: unknown, puzzle: Puzzle): StoredMurdokuResolution | null {
  if (!isRecord(value) || typeof value.murdererId !== "string") {
    return null;
  }
  const murderer = puzzle.suspects.find((suspect) => suspect.id === value.murdererId);
  const cellCount = puzzle.board.width * puzzle.board.height;
  const victimCell = readCell(value.victimCell, cellCount);
  if (!murderer || victimCell === null || !puzzle.board.isOccupiable(victimCell)) {
    return null;
  }
  if (typeof value.roomId !== "string" || !puzzle.board.rooms.has(value.roomId)) {
    return null;
  }
  return { murdererId: murderer.id, victimCell, roomId: value.roomId };
}

function readHintParams(value: unknown): Record<string, string | number> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const clean: Record<string, string | number> = {};
  for (const [key, param] of Object.entries(value).slice(0, MAX_HINT_PARAMS)) {
    if (typeof param === "string" || (typeof param === "number" && Number.isFinite(param))) {
      clean[key] = param;
    }
  }
  return clean;
}

function readHintChildren(value: unknown, depth: number): Explanation[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const children: Explanation[] = [];
  for (const child of value.slice(0, MAX_HINT_PARAMS)) {
    const read = readExplanation(child, depth + 1);
    if (read) {
      children.push(read);
    }
  }
  return children;
}

function readExplanation(value: unknown, depth: number): Explanation | null {
  if (!isRecord(value) || typeof value.key !== "string" || depth > MAX_HINT_DEPTH) {
    return null;
  }
  const params = readHintParams(value.params);
  const children = readHintChildren(value.children, depth);
  return {
    key: value.key,
    ...(params ? { params } : {}),
    ...(children.length > 0 ? { children } : {}),
  };
}

function readHintLine(value: unknown, puzzle: Puzzle): MurdokuLine | null {
  if (!isRecord(value) || (value.axis !== "row" && value.axis !== "col")) {
    return null;
  }
  const max = value.axis === "row" ? puzzle.board.height : puzzle.board.width;
  return typeof value.index === "number" &&
    Number.isInteger(value.index) &&
    value.index >= 0 &&
    value.index < max
    ? { axis: value.axis, index: value.index }
    : null;
}

function readHintRoom(value: unknown, puzzle: Puzzle): string | null {
  return typeof value === "string" && puzzle.board.rooms.has(value) ? value : null;
}

function readHintPerson(value: unknown, puzzle: Puzzle): PersonId | null {
  if (typeof value !== "string") {
    return null;
  }
  return puzzle.suspects.some((suspect) => suspect.id === value) ? value : null;
}

function readHint(value: unknown, puzzle: Puzzle): MurdokuHintState | null {
  if (!isRecord(value) || typeof value.stage !== "string" || !HINT_STAGES.has(value.stage)) {
    return null;
  }
  const explanation = readExplanation(value.explanation, 0);
  if (!explanation) {
    return null;
  }

  return {
    stage: value.stage as MurdokuHintStage,
    explanation,
    line: readHintLine(value.line, puzzle) ?? null,
    roomId: readHintRoom(value.roomId, puzzle),
    cells: readCells(value.cells, puzzle.board.width * puzzle.board.height),
    personId: readHintPerson(value.personId, puzzle),
  };
}

interface ReadCurrent {
  current: StoredMurdokuCurrent;
  puzzle: Puzzle;
}

interface ReadBoard {
  placements: Record<PersonId, Cell>;
  phase: StoredMurdokuCurrent["phase"];
  resolution: StoredMurdokuResolution | null;
}

function readBoard(value: Record<string, unknown>, puzzle: Puzzle): ReadBoard {
  const resolution = readResolution(value.resolution, puzzle);
  if (value.phase !== "solved" || resolution === null) {
    return {
      placements: readPlacements(value.placements, puzzle, false),
      phase: "playing",
      resolution: null,
    };
  }

  const placements = readPlacements(value.placements, puzzle, true);
  if (placements[VICTIM_ID] !== resolution.victimCell) {
    // Een oplossing zonder slachtoffer op het opgeslagen vak is geen oplossing.
    return {
      placements: readPlacements(value.placements, puzzle, false),
      phase: "playing",
      resolution: null,
    };
  }
  return { placements, phase: "solved", resolution };
}

function readSelected(value: unknown, puzzle: Puzzle): PersonId | null {
  if (typeof value !== "string") {
    return null;
  }
  return puzzle.suspects.some((suspect) => suspect.id === value) ? value : null;
}

function readHintsUsed(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, MAX_HINTS_USED)
    : 0;
}

function readCurrent(value: unknown): ReadCurrent | null {
  if (!isRecord(value) || typeof value.levelId !== "string") {
    return null;
  }
  const puzzle = puzzleForLevelId(value.levelId);
  if (!puzzle) {
    return null;
  }

  return {
    puzzle,
    current: {
      levelId: value.levelId,
      ...readBoard(value, puzzle),
      crosses: readCells(value.crosses, puzzle.board.width * puzzle.board.height),
      selected: readSelected(value.selected, puzzle),
      mode: value.mode === "cross" ? "cross" : "place",
      hintsUsed: readHintsUsed(value.hintsUsed),
      hint: readHint(value.hint, puzzle),
    },
  };
}

interface Normalized {
  state: StoredMurdokuState;
  puzzle: Puzzle | null;
}

function migratedCurrent(value: Record<string, unknown>): unknown {
  if (value.version !== 0 && value.version !== undefined) {
    return value.current;
  }
  // Versie 0 (en de versieloze schets) gebruikte `marks` en kende geen hintstand.
  return isRecord(value.current)
    ? { ...value.current, crosses: value.current.crosses ?? value.current.marks }
    : value.current;
}

function normalize(value: unknown): Normalized {
  if (!isRecord(value)) {
    return { state: emptyMurdokuState(), puzzle: null };
  }

  const version = value.version;
  const legacy = version === 0 || version === undefined || version === 1;
  if (version !== STORAGE_VERSION && !legacy) {
    return { state: emptyMurdokuState(), puzzle: null };
  }

  const read = readCurrent(migratedCurrent(value));

  return {
    state: {
      version: STORAGE_VERSION,
      profileId: PROFILE_ID,
      current: read?.current ?? null,
      solved: readSolved(value.solved),
      // Een oudere vorm kent nog geen niveau, log of instellingen voor het
      // adaptieve deel; die beginnen dan bij de kleinste zaak.
      settings: readSettings(value.settings),
      adaptive:
        version === STORAGE_VERSION ? readAdaptive(value.adaptive) : DEFAULT_MURDOKU_ADAPTIVE,
      attempts: version === STORAGE_VERSION ? readAttempts(value.attempts) : [],
    },
    puzzle: read?.puzzle ?? null,
  };
}

function readRaw(): unknown {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }
    // Een bestaande speler uit #125 staat nog onder de v1-sleutel.
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw || raw.length > MAX_STORED_CHARS) {
      return null;
    }
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function loadMurdokuState(): StoredMurdokuState {
  return normalize(readRaw()).state;
}

export function restoreMurdokuState(): MurdokuRestoredState {
  const { state, puzzle } = normalize(readRaw());
  const current = state.current;

  return {
    puzzle: current ? puzzle : null,
    play:
      current === null
        ? null
        : {
            levelId: current.levelId,
            placements: new Map<PersonId, Cell>(
              Object.entries(current.placements) as [PersonId, Cell][],
            ),
            manualCrosses: new Set(current.crosses),
            selected: current.selected,
            mode: current.mode,
            phase: current.phase,
            wrongCheck: false,
            resolution: current.resolution ? { ...current.resolution } : null,
          },
    hint: current?.hint ?? null,
    hintsUsed: current?.hintsUsed ?? 0,
    solvedCaseIds: new Set(state.solved),
    settings: state.settings,
    adaptive: state.adaptive,
    attempts: state.attempts,
  };
}

function currentFromPlay(
  play: MurdokuPlayState,
  hint: MurdokuHintState | null,
  hintsUsed: number,
): StoredMurdokuCurrent {
  return {
    levelId: play.levelId,
    placements: Object.fromEntries(play.placements),
    crosses: [...play.manualCrosses].slice(0, MAX_CELLS),
    selected: play.selected,
    mode: play.mode,
    phase: play.phase,
    resolution: play.resolution ? { ...play.resolution } : null,
    hintsUsed: Math.min(Math.max(Math.trunc(hintsUsed), 0), MAX_HINTS_USED),
    hint,
  };
}

export function saveMurdokuState(input: MurdokuSaveInput): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    const state: StoredMurdokuState = {
      version: STORAGE_VERSION,
      profileId: PROFILE_ID,
      current: input.play ? currentFromPlay(input.play, input.hint, input.hintsUsed) : null,
      solved: [...input.solvedCaseIds]
        .filter((id) => CASE_IDS.has(id))
        .slice(0, MURDOKU_CASES.length),
      settings: input.settings,
      adaptive: readAdaptive(input.adaptive),
      attempts: readAttempts(input.attempts),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
