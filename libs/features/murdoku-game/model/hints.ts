import {
  VICTIM_ID,
  nextMurdokuHint,
  type Cell,
  type Explanation,
  type MurdokuHint,
  type PersonId,
  type Puzzle,
} from "@entities/murdoku";
import { crossedCells, type MurdokuPlayState } from "./play";

/** De trap van één hint: wijzen, wegstrepen, plaatsen. */
export type MurdokuHintStage = "focus" | "cross" | "place" | "check" | "none";

/**
 * De hint zoals het bord en de pagina hem tonen. De uitleg is een engine-
 * `Explanation`, zodat dezelfde Nederlandse tekstlaag hem rendert als de
 * aanwijzingen; het bord licht `cells` op.
 */
export interface MurdokuHintState {
  stage: MurdokuHintStage;
  explanation: Explanation;
  /** De rij of kolom die oplicht, als de stap daarover gaat. */
  line: { axis: "row" | "col"; index: number } | null;
  /** De kamer die oplicht, als de stap daarover gaat. */
  roomId: string | null;
  /** De vakjes die oplichten. */
  cells: Cell[];
  personId: PersonId | null;
}

/** Wat een hintstap op het bord doet; nooit meer dan één kruisje of één persoon. */
export type MurdokuHintApply =
  | { kind: "cross"; cell: Cell }
  | { kind: "place"; personId: PersonId; cell: Cell };

export interface MurdokuHintPlan {
  state: MurdokuHintState;
  apply: MurdokuHintApply | null;
}

/** De vakjes van een rij of kolom. */
function lineCells(puzzle: Puzzle, line: { axis: "row" | "col"; index: number }): Cell[] {
  const cells =
    line.axis === "row" ? puzzle.board.cellsInRow(line.index) : puzzle.board.cellsInCol(line.index);
  return [...cells];
}

/** De vakjes van een kamer. */
function roomCells(puzzle: Puzzle, roomId: string): Cell[] {
  return [...puzzle.board.cellsInRoom(roomId)];
}

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

/** De lichte cue: de rij, kolom of kamer waar de volgende stap zit. */
function focusPlan(
  puzzle: Puzzle,
  cell: Cell,
  personId: PersonId | null,
  line: MurdokuHint["line"],
): MurdokuHintPlan {
  const suffix = personId === null ? "" : "Name";

  if (line) {
    const key = line.axis === "row" ? `hint.focusRow${suffix}` : `hint.focusCol${suffix}`;
    return {
      state: {
        stage: "focus",
        explanation: { key, params: { num: line.index + 1, name: personId ?? "" } },
        line,
        roomId: null,
        cells: lineCells(puzzle, line),
        personId,
      },
      apply: null,
    };
  }

  const roomId = puzzle.board.roomIdOf(cell);
  return {
    state: {
      stage: "focus",
      explanation: {
        key: `hint.focusRoom${suffix}`,
        params: { room: roomId, name: personId ?? "" },
      },
      line: null,
      roomId,
      cells: roomCells(puzzle, roomId),
      personId,
    },
    apply: null,
  };
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
    },
    apply: null,
  };
}

/**
 * De volgende hintstap. De eerste tik wijst alleen (en verandert niets); de
 * tweede past één gedwongen zet toe: een onmogelijk vakje wegstrepen of één
 * persoon plaatsen. De engine bepaalt welke stap dat is — nooit de UI.
 *
 * De laatste persoon wordt nooit geplaatst: dan zou de hint het antwoord geven
 * en houdt het kind niets meer om zelf te doen.
 */
export function planMurdokuHint(
  puzzle: Puzzle,
  play: MurdokuPlayState,
  previous: MurdokuHintState | null,
): MurdokuHintPlan {
  const continues = previous?.stage === "focus";
  const hint = nextMurdokuHint(puzzle, {
    placements: play.placements,
    crosses: crossedCells(puzzle, play),
  });

  if (!hint) return nonePlan("hint.none");

  const target = hint.placeCell ?? hint.cells[0];
  if (target === undefined) return nonePlan("hint.none");

  if (!continues) return focusPlan(puzzle, target, hint.personId, hint.line);

  if (hint.kind === "unplace" || hint.kind === "unmark" || hint.kind === "uncross") {
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
      },
      apply: null,
    };
  }

  if (hint.kind === "place") {
    const unplaced = puzzle.suspects.filter((person) => !play.placements.has(person.id));
    if (hint.personId === null || unplaced.length <= 1) {
      return nonePlan("hint.lastPerson");
    }
    return {
      state: {
        stage: "place",
        explanation: placeReason(puzzle, hint.personId, target),
        line: null,
        roomId: null,
        cells: [target],
        personId: hint.personId,
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
    },
    apply: { kind: "cross", cell },
  };
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
