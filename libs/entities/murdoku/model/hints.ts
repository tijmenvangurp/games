import { DeductionEngine } from "./engine/solver/DeductionEngine";
import type { DeductionStep, HintKind, Technique } from "./engine/solver/DeductionStep";
import type { Explanation, Cell, PersonId } from "./engine/domain/types";
import type { Puzzle } from "./engine/domain/Puzzle";
import type { Clue } from "./engine/clues/Clue";

/** Wat de speler al op het bord heeft staan; de hint bouwt daarop verder. */
interface MurdokuHintBoard {
  placements: ReadonlyMap<PersonId, Cell>;
  /** Handmatige én automatische kruisjes; een leeg vakje dat niemand meer kan bezetten. */
  crosses?: ReadonlySet<Cell>;
}

/**
 * Eén gedwongen stap uit de deductie-engine, als antwoord op de hintknop.
 *
 * De engine levert de stap en de vakjes waar de stap over gaat; de spel- en
 * UI-laag maakt er de hinttrap van. `kind` vertelt wat voor stap het is:
 * `place` zet één persoon, `exclude` streept een vakje weg waar niemand kan
 * staan, en de correctievarianten (`unplace`, `unmark`, `uncross`) zeggen dat
 * er iets op het bord staat dat niet kan kloppen.
 */
export interface MurdokuHint {
  kind: HintKind;
  /** De persoon waar de stap over gaat, als de engine er één noemt. */
  personId: PersonId | null;
  /** De vakjes waar de stap over gaat; bij `exclude` de weg te strepen vakjes. */
  cells: Cell[];
  /** Het vakje waar een `place`-stap de persoon neerzet. */
  placeCell: Cell | null;
  technique: Technique;
  /** De rij of kolom die de engine bij deze stap noemt, voor het oplichten. */
  line: MurdokuLine | null;
  /** De kamer die de engine bij deze stap noemt, voor het oplichten. */
  roomId: string | null;
  /** De aanwijzing van de persoon waar de stap over gaat; de clue-nudge toont die. */
  clue: Clue | null;
  /** De reden van de stap als engine-uitleg, bijvoorbeeld de eigen aanwijzing. */
  reason: Explanation | null;
}

/** Een rij of kolom op het bord, 0-geïndexeerd. */
export interface MurdokuLine {
  axis: "row" | "col";
  index: number;
}

/** Leest de rij, kolom en kamer uit de parameters van een engine-stap. */
function lineOf(step: DeductionStep): MurdokuLine | null {
  const params = step.explanation.params ?? {};
  const key = step.explanation.key;
  const rowNum = params.rowNum ?? (key.endsWith("forcedCellRow") ? params.line : undefined);
  if (typeof rowNum === "number") return { axis: "row", index: rowNum - 1 };
  const colNum = params.colNum ?? (key.endsWith("forcedCellCol") ? params.line : undefined);
  if (typeof colNum === "number") return { axis: "col", index: colNum - 1 };
  return null;
}

function roomOf(step: DeductionStep): string | null {
  const params = step.explanation.params ?? {};
  const room = params.room ?? params.roomId;
  return typeof room === "string" && room.length > 0 ? room : null;
}

/**
 * De aanwijzing die de persoon het sterkst beperkt: de kleinste kandidatenlijst.
 * Die gebruikt de clue-nudge als verwijzing en als reden. Een relationele
 * aanwijzing zonder kandidatenlijst is de terugval, zodat er altijd iets te
 * vertellen is.
 */
function narrowestClue(puzzle: Puzzle, personId: PersonId): Clue | null {
  const suspect = puzzle.suspects.find((person) => person.id === personId);
  let best: { clue: Clue; size: number } | null = null;
  let fallback: Clue | null = null;

  for (const clue of suspect?.clues ?? []) {
    fallback ??= clue;
    const candidates = clue.candidateCells(puzzle.board);
    if (candidates === null || candidates.size === 0) continue;
    if (best === null || candidates.size < best.size) {
      best = { clue, size: candidates.size };
    }
  }

  return best?.clue ?? fallback;
}

/**
 * De volgende gedwongen stap, berekend uit de deductie-engine en het bord van
 * de speler. `null` betekent: er is geen stap meer (het bord is klaar of de
 * engine ziet geen voorwaartse deductie).
 */
export function nextMurdokuHint(source: Puzzle, board: MurdokuHintBoard): MurdokuHint | null {
  const hint = new DeductionEngine(source).nextHint(board.placements, board.crosses ?? new Set());
  if (!hint) return null;

  const personId = hint.step.personId ?? null;
  const clue = personId === null ? null : narrowestClue(source, personId);

  return {
    kind: hint.kind,
    personId,
    cells: [...hint.focus],
    placeCell: hint.kind === "place" ? (hint.focus[0] ?? null) : null,
    technique: hint.step.technique,
    line: lineOf(hint.step),
    roomId: roomOf(hint.step),
    clue,
    reason: clue?.describe() ?? null,
  };
}
