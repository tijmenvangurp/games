import { Clue } from "./Clue.ts";
import { ON_OBJECT_KEY_SUFFIX } from "./unaryClues.ts";
import type { Board } from "../domain/Board.ts";
import type { Solution } from "../domain/Solution.ts";
import type { Puzzle } from "../domain/Puzzle.ts";
import type { Cell, Explanation, PersonId } from "../domain/types.ts";

/**
 * "{name} was the ONLY person in <some set of cells>." The subject is in the set
 * and no other person is. `candidateCells` confines the subject to the set;
 * `forbiddenForOthers` keeps everyone else out of it (so it's fully deducible);
 * `test` verifies the "only" part across the whole solution. Subclasses supply the
 * cell set and the wording.
 */
abstract class UniqueInCellsClue extends Clue {
  protected abstract cells(board: Board): Set<Cell>;
  abstract describe(): Explanation;

  override candidateCells(board: Board): Set<Cell> {
    return this.cells(board);
  }

  override forbiddenForOthers(board: Board): Set<Cell> {
    return this.cells(board);
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const set = this.cells(puzzle.board);
    if (!set.has(solution.cellOf(subjectId))) return false;
    for (const [id, cell] of solution.entries()) {
      if (id !== subjectId && set.has(cell)) return false;
    }
    return true;
  }

  override violatedBy(
    subjectId: PersonId,
    placement: ReadonlyMap<PersonId, Cell>,
    puzzle: Puzzle,
  ): boolean {
    const set = this.cells(puzzle.board);
    const subjectCell = placement.get(subjectId);
    if (subjectCell !== undefined && !set.has(subjectCell)) return true;
    for (const [id, c] of placement) {
      if (id !== subjectId && set.has(c)) return true;
    }
    return false;
  }
}

/** "{name} was the only person on a {object}." (in/under for tent/parasol) */
export class UniqueOnObjectClue extends UniqueInCellsClue {
  constructor(readonly object: string) {
    super();
  }
  protected cells(board: Board): Set<Cell> {
    return board.cellsWithObject(this.object);
  }
  describe(): Explanation {
    const suffix = ON_OBJECT_KEY_SUFFIX[this.object] ?? "";
    return { key: `clue.uniqueOnObject${suffix}`, params: { object: this.object } };
  }
}

/** "{name} was the only person beside a {object}." */
export class UniqueNearObjectClue extends UniqueInCellsClue {
  constructor(readonly object: string) {
    super();
  }
  protected cells(board: Board): Set<Cell> {
    return board.cellsNearObject(this.object);
  }
  describe(): Explanation {
    return { key: "clue.uniqueNearObject", params: { object: this.object } };
  }
}

/** "{name} was the only person beside a window." */
export class UniqueNearWindowClue extends UniqueInCellsClue {
  protected cells(board: Board): Set<Cell> {
    return board.cellsNearWindow();
  }
  describe(): Explanation {
    return { key: "clue.uniqueNearWindow" };
  }
}

/** "{name} was the only person beside a door." */
export class UniqueNearDoorClue extends UniqueInCellsClue {
  protected cells(board: Board): Set<Cell> {
    return board.cellsNearDoor();
  }
  describe(): Explanation {
    return { key: "clue.uniqueNearDoor" };
  }
}

/** "{name} was the only person outside / inside." */
export class UniqueOutsideClue extends UniqueInCellsClue {
  constructor(readonly outside: boolean) {
    super();
  }
  protected cells(board: Board): Set<Cell> {
    return board.cellsOutside(this.outside);
  }
  describe(): Explanation {
    return { key: this.outside ? "clue.uniqueOutside" : "clue.uniqueInside" };
  }
}
