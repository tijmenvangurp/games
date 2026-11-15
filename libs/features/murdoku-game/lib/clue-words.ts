import {
  AndClue,
  AtWallClue,
  BesideSameObjectClue,
  CornerClue,
  DirectionFromObjectClue,
  InColClue,
  InRoomClue,
  InRowClue,
  NearAnyObjectClue,
  NearDoorClue,
  NearObjectClue,
  NearWindowClue,
  NotClue,
  OnObjectClue,
  OrClue,
  OutsideClue,
  SameLineAsObjectClue,
  SameRoomAsObjectClue,
  UniqueNearDoorClue,
  UniqueNearObjectClue,
  UniqueNearWindowClue,
  UniqueOnObjectClue,
  UniqueOutsideClue,
  type Cell,
  type Clue,
  type PersonId,
  type Puzzle,
} from "@entities/murdoku";
import type { HelpMarks } from "./vendored/helpMarks";
import type { MurdokuText } from "./text";

/** Wat een tik op een woord in een aanwijzing op het bord laat oplichten. */
export type MurdokuClueFocus =
  /** Een rij, kolom, hoek of muur: één rustige contour om het gebied. */
  | { kind: "area"; cells: readonly Cell[] }
  /** Objecten, ramen, deuren of één vakje: een krijtring. */
  | { kind: "ring"; cells: readonly Cell[] }
  /** Een kamer: de omtrek van die kamer. */
  | { kind: "room"; roomId: string }
  /** Een persoon: zijn vakje, of anders de vakjes waar hij nog kan staan. */
  | { kind: "person"; personId: PersonId };

/** Eén stuk van een aanwijzing: gewone tekst, of een tikbaar woord met een doel. */
export interface MurdokuClueWord {
  text: string;
  focus: MurdokuClueFocus | null;
}

interface Reference {
  label: string;
  focus: MurdokuClueFocus;
}

type Sink = Reference[];

/** Aanwijzingen die precies één objecttype noemen. */
const OBJECT_CLUES = [
  OnObjectClue,
  NearObjectClue,
  UniqueOnObjectClue,
  UniqueNearObjectClue,
  SameLineAsObjectClue,
  SameRoomAsObjectClue,
] as const;

function objectFocus(puzzle: Puzzle, type: string): MurdokuClueFocus {
  return { kind: "ring", cells: puzzle.board.objectCells(type) };
}

function pushRing(puzzle: Puzzle, type: string, label: string, out: Sink): void {
  out.push({ label, focus: objectFocus(puzzle, type) });
}

/** Het objecttype van een aanwijzing die één object noemt, of `null`. */
function objectClueType(clue: Clue): string | null {
  const found = OBJECT_CLUES.some((type) => clue instanceof type);
  return found ? (clue as unknown as { object: string }).object : null;
}

/** Rijen en kolommen noemen hun nummer; de rest van de zin blijft tekst. */
function lineReferences(clue: Clue, puzzle: Puzzle, text: MurdokuText, out: Sink): boolean {
  if (!(clue instanceof InRowClue) && !(clue instanceof InColClue)) return false;
  const cells =
    clue instanceof InRowClue
      ? [...puzzle.board.cellsInRow(clue.row)]
      : [...puzzle.board.cellsInCol(clue.col)];
  const label =
    clue instanceof InRowClue ? text.linePhrase("row", clue.row) : text.linePhrase("col", clue.col);
  out.push({ label, focus: { kind: "area", cells } });
  return true;
}

/** Een kamer licht als geheel op. */
function roomReferences(clue: Clue, text: MurdokuText, out: Sink): boolean {
  if (!(clue instanceof InRoomClue)) return false;
  out.push({ label: text.roomPhrase(clue.room), focus: { kind: "room", roomId: clue.room } });
  return true;
}

/** Objecten die de zin noemt: het voorwerp zelf licht op. */
function objectReferences(clue: Clue, puzzle: Puzzle, text: MurdokuText, out: Sink): boolean {
  const type = objectClueType(clue);
  if (type !== null) {
    const form = clue instanceof SameRoomAsObjectClue ? "nom" : undefined;
    pushRing(puzzle, type, text.objectPhrase(type, form), out);
    return true;
  }
  if (clue instanceof NearAnyObjectClue) {
    for (const object of clue.objects) pushRing(puzzle, object, text.objectPhrase(object), out);
    return true;
  }
  if (clue instanceof BesideSameObjectClue) {
    pushRing(puzzle, clue.object, text.objectPhrase(clue.object), out);
    pushRing(puzzle, clue.object, text.objectPhrase(clue.object, "same"), out);
    return true;
  }
  if (clue instanceof DirectionFromObjectClue) {
    const form = clue.all ? "every" : undefined;
    pushRing(puzzle, clue.object, text.objectPhrase(clue.object, form), out);
    return true;
  }
  return false;
}

/** Ramen en deuren zijn zelf de verwijzing, ook al kun je er niet staan. */
function fixtureReferences(clue: Clue, puzzle: Puzzle, text: MurdokuText, out: Sink): boolean {
  const windows = clue instanceof NearWindowClue || clue instanceof UniqueNearWindowClue;
  if (windows) {
    pushRing(puzzle, "window", text.objectPhrase("window"), out);
    return true;
  }
  const doors = clue instanceof NearDoorClue || clue instanceof UniqueNearDoorClue;
  if (doors) {
    pushRing(puzzle, "door", text.objectPhrase("door"), out);
    return true;
  }
  return false;
}

/** Hoeken, muren en binnen/buiten: een gebied zonder object of kamer. */
function areaReferences(clue: Clue, puzzle: Puzzle, text: MurdokuText, out: Sink): boolean {
  if (clue instanceof CornerClue) {
    const cells = [...puzzle.board.cornerCells()];
    out.push({ label: text.word("corner"), focus: { kind: "area", cells } });
    return true;
  }
  if (clue instanceof AtWallClue) {
    const cells = [...puzzle.board.cellsAtWall()];
    out.push({ label: text.word("wall"), focus: { kind: "area", cells } });
    return true;
  }
  if (clue instanceof OutsideClue || clue instanceof UniqueOutsideClue) {
    const cells = [...puzzle.board.cellsOutside(clue.outside)];
    const label = text.word(clue.outside ? "outside" : "inside");
    out.push({ label, focus: { kind: "area", cells } });
    return true;
  }
  return false;
}

/** Wie er nog meer in de aanwijzing staat: alleen echte persoonsnamen. */
function personReferences(
  clue: Clue,
  puzzle: Puzzle,
  subjectId: PersonId,
  text: MurdokuText,
  out: Sink,
): void {
  const params = clue.describe().params ?? {};
  const ids = puzzle.allIds();
  const people = typeof params.people === "string" ? params.people.split(",") : [];
  const candidates = typeof params.target === "string" ? [params.target, ...people] : people;

  for (const personId of candidates) {
    if (personId === subjectId || !ids.includes(personId)) continue;
    out.push({ label: puzzle.nameOf(personId), focus: { kind: "person", personId } });
  }
}

/** De verwijzingen die een aanwijzing noemt, in de woorden van de zin zelf. */
function references(
  puzzle: Puzzle,
  clue: Clue,
  subjectId: PersonId,
  text: MurdokuText,
  out: Sink,
): void {
  if (clue instanceof NotClue) return references(puzzle, clue.inner, subjectId, text, out);
  if (clue instanceof AndClue || clue instanceof OrClue) {
    for (const child of clue.clues) references(puzzle, child, subjectId, text, out);
    return;
  }
  if (lineReferences(clue, puzzle, text, out)) return;
  if (roomReferences(clue, text, out)) return;
  if (objectReferences(clue, puzzle, text, out)) return;
  if (fixtureReferences(clue, puzzle, text, out)) return;
  if (areaReferences(clue, puzzle, text, out)) return;
  personReferences(clue, puzzle, subjectId, text, out);
}

/**
 * Knipt een aanwijzing in stukken tekst, waarbij elk genoemd object, elke kamer,
 * elke persoon en elke rij of kolom een tikbaar woord wordt. De zin zelf
 * verandert niet: alleen de verwijzingen worden knoppen.
 */
export function clueWords(
  puzzle: Puzzle,
  clue: Clue,
  subjectId: PersonId,
  text: MurdokuText,
): MurdokuClueWord[] {
  const sentence = text.clue(clue, subjectId);
  const refs: Reference[] = [];
  references(puzzle, clue, subjectId, text, refs);

  const found = refs
    .map((reference) => ({ ...reference, start: sentence.indexOf(reference.label) }))
    .filter((reference) => reference.label.length > 1 && reference.start >= 0)
    .sort((a, b) => a.start - b.start || b.label.length - a.label.length);

  const spans: { start: number; end: number; focus: MurdokuClueFocus }[] = [];
  for (const reference of found) {
    const end = reference.start + reference.label.length;
    if (spans.some((span) => reference.start < span.end && end > span.start)) continue;
    spans.push({ start: reference.start, end, focus: reference.focus });
  }
  spans.sort((a, b) => a.start - b.start);

  const words: MurdokuClueWord[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) words.push({ text: sentence.slice(cursor, span.start), focus: null });
    words.push({ text: sentence.slice(span.start, span.end), focus: span.focus });
    cursor = span.end;
  }
  if (cursor < sentence.length) words.push({ text: sentence.slice(cursor), focus: null });
  return words;
}

/** De vakjes waar een persoon nu kan staan, puur als verwijzing (geen deductie). */
function personCells(puzzle: Puzzle, personId: PersonId): Cell[] {
  const suspect = puzzle.suspects.find((person) => person.id === personId);
  let cells = new Set<Cell>(puzzle.board.occupiableCells());
  for (const clue of suspect?.clues ?? []) {
    const candidates = clue.candidateCells(puzzle.board);
    if (candidates === null) continue;
    cells = new Set([...cells].filter((cell) => candidates.has(cell)));
  }
  return [...cells];
}

/** Het bordbeeld bij een tik op een woord: vakjes, kamers en rustige markeringen. */
export interface MurdokuFocusView {
  cells: Set<Cell>;
  rooms: Set<string>;
  marks: HelpMarks;
}

/**
 * Vertaalt een tikbare verwijzing naar wat het bord moet tekenen. De markeringen
 * zijn dezelfde rustige contouren als de verwijzingen van de aanwijzingen.
 */
export function focusView(puzzle: Puzzle, focus: MurdokuClueFocus | null): MurdokuFocusView {
  const cells = new Set<Cell>();
  const rooms = new Set<string>();
  const marks: HelpMarks = {
    areas: [],
    ring: new Set<Cell>(),
    rooms,
    windows: false,
    doors: false,
    redRing: new Set<Cell>(),
    redRooms: new Set<string>(),
    redWindows: false,
    redDoors: false,
  };

  if (!focus) return { cells, rooms, marks };

  if (focus.kind === "room") {
    rooms.add(focus.roomId);
    for (const cell of puzzle.board.cellsInRoom(focus.roomId)) cells.add(cell);
    return { cells, rooms, marks };
  }

  const focused = focus.kind === "person" ? personCells(puzzle, focus.personId) : [...focus.cells];
  for (const cell of focused) cells.add(cell);

  if (focus.kind === "ring") marks.ring = new Set(focused);
  else marks.areas.push({ cells: new Set(focused), neg: false });

  return { cells, rooms, marks };
}

/** Of twee verwijzingen hetzelfde doel hebben; gebruikt voor de actieve knop. */
export function sameClueFocus(a: MurdokuClueFocus | null, b: MurdokuClueFocus | null): boolean {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === "room" && b.kind === "room") return a.roomId === b.roomId;
  if (a.kind === "person" && b.kind === "person") return a.personId === b.personId;
  const left = "cells" in a ? a.cells : [];
  const right = "cells" in b ? b.cells : [];
  return left.length === right.length && left.every((cell, index) => cell === right[index]);
}
