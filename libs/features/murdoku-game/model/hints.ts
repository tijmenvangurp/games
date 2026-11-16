import {
  VICTIM_ID,
  nextMurdokuHint,
  type Cell,
  type Explanation,
  type MurdokuLine,
  type PersonId,
  type Puzzle,
} from "@entities/murdoku";
import { clueFocusTargets, focusView, type MurdokuClueFocus } from "../lib/clue-words";
import { createMurdokuText } from "../lib/text";
import { crossedCells, type MurdokuPlayState } from "./play";

/** De trap van één hint: aanwijzing, exacte plek met reden, en dan pas de zet. */
export type MurdokuHintStage = "clue" | "focus" | "cross" | "place" | "check" | "none";

/**
 * De hint zoals het bord en de pagina hem tonen. De uitleg is een engine-
 * `Explanation`, zodat dezelfde Nederlandse tekstlaag hem rendert als de
 * aanwijzingen; het bord licht `cells` op.
 */
export interface MurdokuHintState {
  stage: MurdokuHintStage;
  explanation: Explanation;
  /** De rij of kolom die oplicht, als de stap daarover gaat. */
  line: MurdokuLine | null;
  /** De kamer die oplicht, als de stap daarover gaat. */
  roomId: string | null;
  /** De vakjes die oplichten. */
  cells: Cell[];
  personId: PersonId | null;
  /** De rustige verwijzing van de clue-nudge (objectring, kamer of persoon). */
  focus: MurdokuClueFocus | null;
}

/** Wat een hintstap op het bord doet; nooit meer dan één kruisje of één persoon. */
export type MurdokuHintApply =
  | { kind: "cross"; cell: Cell }
  | { kind: "place"; personId: PersonId; cell: Cell };

export interface MurdokuHintPlan {
  state: MurdokuHintState;
  apply: MurdokuHintApply | null;
}

/** De enginehint zonder de null-stand. */
type MurdokuHintStep = NonNullable<ReturnType<typeof nextMurdokuHint>>;

/** De vrije vakjes: bezetbaar, niet weggestreept en nog leeg. */
function freeCells(puzzle: Puzzle, play: MurdokuPlayState): Set<Cell> {
  const crosses = crossedCells(puzzle, play);
  const occupied = new Set(play.placements.values());
  return new Set(
    [...puzzle.board.occupiableCells()].filter((cell) => !crosses.has(cell) && !occupied.has(cell)),
  );
}

/**
 * Een rij of kolom met nog één vrij vakje dwingt de lijn van dat vakje dicht:
 * wie daar staat, houdt die hele lijn bezet. Alleen die twee lijnen kunnen een
 * vakje op deze manier leegmaken.
 */
function forcedLineReason(puzzle: Puzzle, play: MurdokuPlayState, cell: Cell): Explanation | null {
  const { row, col } = puzzle.board.rc(cell);
  const free = freeCells(puzzle, play);
  const freesIn = (cells: Iterable<Cell>): Cell[] => [...cells].filter((c) => free.has(c));

  for (let r = 0; r < puzzle.board.height; r += 1) {
    const frees = freesIn(puzzle.board.cellsInRow(r));
    if (frees.length === 1 && frees[0] !== cell && puzzle.board.rc(frees[0]).col === col) {
      return { key: "hint.crossRow", params: { cell, num: r + 1 } };
    }
  }
  for (let c = 0; c < puzzle.board.width; c += 1) {
    const frees = freesIn(puzzle.board.cellsInCol(c));
    if (frees.length === 1 && frees[0] !== cell && puzzle.board.rc(frees[0]).row === row) {
      return { key: "hint.crossCol", params: { cell, num: c + 1 } };
    }
  }
  return null;
}

/**
 * De korte reden voor een weg te strepen vakje, opgebouwd uit wat het kind op
 * het bord ziet: een rij of kolom met nog één vrij vakje, of anders de eerlijke
 * mededeling dat er niemand kan staan. De engine heeft het vakje al onmogelijk
 * gemaakt; deze functie kiest alleen de uitleg die daarbij past.
 */
function crossReason(puzzle: Puzzle, play: MurdokuPlayState, cell: Cell): Explanation {
  return forcedLineReason(puzzle, play, cell) ?? { key: "hint.crossPlain", params: { cell } };
}

/**
 * De uitleg bij een plaatsing. Past de eigen aanwijzing van de persoon op
 * precies één vakje, dan is dat de reden; anders zeggen we eerlijk dat alle
 * andere vakjes niet kunnen.
 */
function placeReason(puzzle: Puzzle, personId: PersonId, cell: Cell): Explanation {
  const suspect = puzzle.suspects.find((person) => person.id === personId);
  for (const clue of suspect?.clues ?? []) {
    const candidates = clue.candidateCells(puzzle.board);
    if (candidates !== null && candidates.size === 1 && candidates.has(cell)) {
      return {
        key: "hint.placeClue",
        params: { name: personId, cell },
        children: [clue.describe()],
      };
    }
  }
  return { key: "hint.place", params: { name: personId, cell } };
}

/** Het object dat de clue-nudge als vraag noemt, als de aanwijzing er een noemt. */
function nudgeObject(clue: MurdokuHintStep["clue"]): string | null {
  const params = clue?.describe().params ?? {};
  if (typeof params.object === "string") return params.object;
  if (typeof params.objects === "string") return params.objects.split(",")[0] ?? null;
  return null;
}

/**
 * De eerste tik: geen kamer en geen vakje, maar de persoon plus waar zijn
 * aanwijzing naar verwijst. De speler zoekt de plek zelf.
 */
function clueNudgePlan(puzzle: Puzzle, hint: MurdokuHintStep): MurdokuHintPlan {
  const personId = hint.personId;
  if (personId === null) return focusPlan(puzzle, hint, hint.reason);

  const text = createMurdokuText(puzzle);
  const targets = hint.clue ? clueFocusTargets(puzzle, hint.clue, personId, text) : [];
  const focus: MurdokuClueFocus = targets.find((target) => target.kind !== "person") ??
    targets[0] ?? { kind: "person", personId };
  const personCells = focusView(puzzle, { kind: "person", personId }).cells;
  const referred = focusView(puzzle, focus).cells;
  const cells = [...new Set([...personCells, ...referred])];
  const object = nudgeObject(hint.clue);

  return {
    state: {
      stage: "clue",
      explanation: object
        ? { key: "hint.clueNudgeObject", params: { name: personId, object } }
        : { key: "hint.clueNudge", params: { name: personId } },
      line: null,
      roomId: null,
      cells,
      personId,
      focus,
    },
    apply: null,
  };
}

/**
 * De tweede tik: de exacte cel die de engine forced, met de reden. Zonder
 * forced cel noemen we geen kamer als antwoord; dan wijzen we eerlijk de
 * vakjes aan die afvallen.
 */
function cellFocusPlan(
  puzzle: Puzzle,
  hint: MurdokuHintStep,
  placeCell: Cell,
  reason: Explanation | null,
): MurdokuHintPlan {
  const roomId = hint.roomId ?? puzzle.board.roomIdOf(placeCell);
  const key = reason
    ? roomId !== null
      ? "hint.focusCellReasonRoom"
      : "hint.focusCellReason"
    : "hint.focusCell";
  return {
    state: {
      stage: "focus",
      explanation: reason
        ? {
            key,
            params: { name: hint.personId ?? "", named: 1, cell: placeCell, room: roomId },
            children: [reason],
          }
        : { key, params: { name: hint.personId ?? "", named: 1, cell: placeCell, room: roomId } },
      line: hint.line,
      roomId,
      cells: [placeCell],
      personId: hint.personId,
      focus: null,
    },
    apply: null,
  };
}

function cellsFocusPlan(hint: MurdokuHintStep, reason: Explanation | null): MurdokuHintPlan {
  if (hint.cells.length === 0) return nonePlan("hint.none");

  const roomId = hint.roomId;
  const key = reason
    ? roomId
      ? "hint.focusCellsReasonRoom"
      : "hint.focusCellsReason"
    : "hint.focusCells";
  return {
    state: {
      stage: "focus",
      explanation: reason
        ? {
            key,
            params: { name: hint.personId ?? "", named: 1, room: roomId ?? "" },
            children: [reason],
          }
        : { key, params: { name: hint.personId ?? "", named: 1, room: roomId ?? "" } },
      line: hint.line,
      roomId,
      cells: hint.cells,
      personId: hint.personId,
      focus: null,
    },
    apply: null,
  };
}

function focusPlan(
  puzzle: Puzzle,
  hint: MurdokuHintStep,
  reason: Explanation | null,
): MurdokuHintPlan {
  return hint.placeCell !== null
    ? cellFocusPlan(puzzle, hint, hint.placeCell, reason)
    : cellsFocusPlan(hint, reason);
}

function nonePlan(key: "hint.none" | "hint.lastPerson"): MurdokuHintPlan {
  return {
    state: {
      stage: "none",
      explanation: { key },
      line: null,
      roomId: null,
      cells: [],
      personId: null,
      focus: null,
    },
    apply: null,
  };
}

/** Een correctie: kijk nog eens naar de persoon op dit vakje; er verandert niets. */
function checkPlan(hint: MurdokuHintStep, target: Cell): MurdokuHintPlan {
  return {
    state: {
      stage: "check",
      explanation: {
        key: "hint.checkPlacement",
        params: { name: hint.personId ?? "", cell: target },
      },
      line: null,
      roomId: null,
      cells: [target],
      personId: hint.personId,
      focus: null,
    },
    apply: null,
  };
}

function isCorrection(hint: MurdokuHintStep): boolean {
  return hint.kind === "unplace" || hint.kind === "unmark" || hint.kind === "uncross";
}

/** De derde tik: pas één gedwongen zet toe, of wijs een correctie aan. */
function applyHintPlan(
  puzzle: Puzzle,
  play: MurdokuPlayState,
  hint: MurdokuHintStep,
): MurdokuHintPlan {
  if (isCorrection(hint)) {
    const target = hint.placeCell ?? hint.cells[0];
    if (target === undefined) return nonePlan("hint.none");
    return checkPlan(hint, target);
  }

  if (hint.kind === "place") {
    const target = hint.placeCell;
    if (target === null || hint.personId === null) return nonePlan("hint.none");
    const unplaced = puzzle.suspects.filter((person) => !play.placements.has(person.id));
    if (unplaced.length <= 1) return nonePlan("hint.lastPerson");
    return {
      state: {
        stage: "place",
        explanation: placeReason(puzzle, hint.personId, target),
        line: null,
        roomId: null,
        cells: [target],
        personId: hint.personId,
        focus: null,
      },
      apply: { kind: "place", personId: hint.personId, cell: target },
    };
  }

  const cell = hint.cells[0];
  if (cell === undefined) return nonePlan("hint.none");

  return {
    state: {
      stage: "cross",
      explanation: crossReason(puzzle, play, cell),
      line: null,
      roomId: null,
      cells: [cell],
      personId: hint.personId,
      focus: null,
    },
    apply: { kind: "cross", cell },
  };
}

/**
 * De volgende hintstap. De eerste tik is een clue-nudge: de persoon en waar
 * zijn aanwijzing naar verwijst, zonder kamer of vakje. De tweede tik wijst de
 * exacte cel die de engine forced en geeft de reden; alleen als de engine geen
 * cel forced, wijst hij eerlijk de afvallende vakjes aan. De derde tik past één
 * gedwongen zet toe.
 *
 * De laatste persoon wordt nooit geplaatst: dan zou de hint het antwoord geven
 * en houdt het kind niets meer om zelf te doen.
 */
export function planMurdokuHint(
  puzzle: Puzzle,
  play: MurdokuPlayState,
  previous: MurdokuHintState | null,
): MurdokuHintPlan {
  const hint = nextMurdokuHint(puzzle, {
    placements: play.placements,
    crosses: crossedCells(puzzle, play),
  });

  if (!hint) return nonePlan("hint.none");

  const startsStep = previous === null || (previous.stage !== "clue" && previous.stage !== "focus");
  if (startsStep) return clueNudgePlan(puzzle, hint);

  if (previous?.stage === "clue") {
    if (isCorrection(hint)) {
      const target = hint.cells[0];
      return target === undefined ? nonePlan("hint.none") : checkPlan(hint, target);
    }
    return focusPlan(puzzle, hint, hint.reason);
  }

  return applyHintPlan(puzzle, play, hint);
}

/** Voert de hintstap uit op het bord; het slachtoffer komt er nooit bij. */
export function applyMurdokuHint(
  puzzle: Puzzle,
  play: MurdokuPlayState,
  apply: MurdokuHintApply,
): MurdokuPlayState {
  if (play.phase === "solved") return play;

  if (apply.kind === "cross") {
    const manualCrosses = new Set(play.manualCrosses);
    manualCrosses.add(apply.cell);
    return { ...play, manualCrosses, wrongCheck: false };
  }

  if (apply.personId === VICTIM_ID) return play;
  const placements = new Map(play.placements);
  placements.set(apply.personId, apply.cell);
  const manualCrosses = new Set(play.manualCrosses);
  manualCrosses.delete(apply.cell);
  return { ...play, placements, manualCrosses, selected: null, wrongCheck: false };
}
