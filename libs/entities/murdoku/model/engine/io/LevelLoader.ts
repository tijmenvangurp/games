import { Board } from "../domain/Board.ts";
import { GameObject } from "../domain/GameObject.ts";
import { Tile } from "../domain/Tile.ts";
import { Room } from "../domain/Room.ts";
import { Suspect } from "../domain/Suspect.ts";
import { Victim } from "../domain/Victim.ts";
import { Puzzle } from "../domain/Puzzle.ts";
import { VICTIM_ID, VOID_ROOM } from "../domain/types.ts";
import type { Cell, Side } from "../domain/types.ts";
import { createClue } from "../clues/ClueFactory.ts";
import { createBoardClue } from "../clues/boardClues.ts";
import type { LevelJson } from "./LevelSchema.ts";

const EMPTY_CHAR = ".";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid level: ${message}`);
}

function buildObjectDefs(level: LevelJson): Map<string, GameObject> {
  const defs = new Map<string, GameObject>();
  for (const [char, def] of Object.entries(level.objects ?? {})) {
    assert(char.length === 1, `object key "${char}" must be a single char`);
    assert(char !== EMPTY_CHAR, `object key "${EMPTY_CHAR}" is reserved for empty`);
    defs.set(char, new GameObject(def.type, def.occupiable));
  }
  return defs;
}

function charAt(map: string[] | undefined, row: number, col: number): string {
  if (!map) return EMPTY_CHAR;
  return map[row][col];
}

function lookupObject(
  defs: Map<string, GameObject>,
  char: string,
  where: string,
): GameObject | null {
  if (char === EMPTY_CHAR) return null;
  const obj = defs.get(char);
  assert(obj, `unknown object char "${char}" in ${where}`);
  return obj;
}

function validateMap(map: string[] | undefined, name: string, width: number, height: number): void {
  if (!map) return;
  assert(map.length === height, `${name} must have ${height} rows`);
  for (const row of map) {
    assert(row.length === width, `${name} rows must be ${width} chars wide`);
  }
}

/** Parse and validate a level JSON object into a Puzzle. With `skipClues` the suspects,
 *  victim and board are built but NO clue objects are constructed — a lightweight load
 *  for the level-picker thumbnails, which only draw the board (rooms / objects / walls). */
export function loadLevel(level: LevelJson, opts: { skipClues?: boolean } = {}): Puzzle {
  assert(level.schema === 1, `unsupported schema ${level.schema}`);
  const { width, height } = level.size;
  assert(width > 0 && height > 0, "size must be positive");

  validateMap(level.roomMap, "roomMap", width, height);
  validateMap(level.groundMap, "groundMap", width, height);
  validateMap(level.topMap, "topMap", width, height);

  // Only rooms actually painted on the board are real. A level — especially one from
  // the editor, which declares every room slot — may list rooms it never places on the
  // grid; those phantom rooms would always read as "empty" and make a "0 empty rooms"
  // clue unsatisfiable. Register only the rooms that appear in the roomMap.
  const usedRoomChars = new Set<string>();
  for (const r of level.roomMap) for (const ch of r) if (ch !== VOID_ROOM) usedRoomChars.add(ch);
  const rooms = new Map<string, Room>();
  for (const [id, def] of Object.entries(level.rooms)) {
    if (usedRoomChars.has(id))
      rooms.set(id, new Room(id, def.nameKey, def.color, def.outside ?? false));
  }

  const objectDefs = buildObjectDefs(level);

  const tiles: Tile[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const roomChar = level.roomMap[row][col];
      // VOID_ROOM marks a cell that belongs to no room (empty exterior) — it has
      // no Room entry and is never occupiable; everything else must be declared.
      assert(
        roomChar === VOID_ROOM || rooms.has(roomChar),
        `unknown room "${roomChar}" at ${row},${col}`,
      );
      const ground = lookupObject(objectDefs, charAt(level.groundMap, row, col), "groundMap");
      const top = lookupObject(objectDefs, charAt(level.topMap, row, col), "topMap");
      tiles.push(new Tile(row, col, roomChar, ground, top));
    }
  }

  // Windows and doors share one mechanic: both sit on a wall and are TWO-SIDED —
  // registered on their cell AND the neighbour across the edge (a boundary/exterior
  // edge has no neighbour, so only the one cell counts). They differ only in looks
  // and which clue they trigger ("beside a window" vs "beside a door").
  const opposite: Record<Side, Side> = { N: "S", S: "N", E: "W", W: "E" };
  const step: Record<Side, [number, number]> = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
  const buildEdges = (
    list: { r: number; c: number; side: Side }[],
    label: string,
  ): Map<Cell, Set<Side>> => {
    const map = new Map<Cell, Set<Side>>();
    const add = (r: number, c: number, side: Side): void => {
      if (r < 0 || r >= height || c < 0 || c >= width) return;
      const cell = r * width + c;
      const set = map.get(cell) ?? new Set<Side>();
      set.add(side);
      map.set(cell, set);
    };
    for (const e of list) {
      assert(
        e.r >= 0 && e.r < height && e.c >= 0 && e.c < width,
        `${label} out of bounds at ${e.r},${e.c}`,
      );
      add(e.r, e.c, e.side);
      const [dr, dc] = step[e.side];
      add(e.r + dr, e.c + dc, opposite[e.side]);
    }
    return map;
  };

  const windows = buildEdges(level.windows ?? [], "window");
  const doors = buildEdges(level.doors ?? [], "door");

  const board = new Board(width, height, tiles, rooms, windows, doors);

  const seen = new Set<string>();
  const suspects = level.suspects.map((s) => {
    assert(s.id !== VICTIM_ID, `suspect id "${s.id}" is reserved`);
    assert(!seen.has(s.id), `duplicate suspect id "${s.id}"`);
    seen.add(s.id);
    const clues = opts.skipClues ? [] : (s.clues ?? []).map(createClue);
    return new Suspect(s.id, s.name, s.attributes ?? {}, clues);
  });

  const victim = new Victim(level.victim.name, level.victim.attributes ?? {});
  const globalClues = opts.skipClues ? [] : (level.globalClues ?? []).map(createClue);
  const boardClues = opts.skipClues ? [] : (level.boardClues ?? []).map(createBoardClue);

  return new Puzzle(level.id, board, suspects, victim, globalClues, boardClues);
}
