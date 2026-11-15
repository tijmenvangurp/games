import { Technique } from "./Technique.ts";
import { OnObjectClue } from "../../clues/unaryClues.ts";
import { RoomExistsClue } from "../../clues/socialClues.ts";
import { AndClue } from "../../clues/compositeClues.ts";
import type { Clue } from "../../clues/Clue.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { Cell, PersonId } from "../../domain/types.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

/** Certain "on <object>" clues, top-level or inside an AND. */
function onObjectList(clue: Clue): OnObjectClue[] {
  if (clue instanceof OnObjectClue) return [clue];
  if (clue instanceof AndClue) return clue.clues.flatMap(onObjectList);
  return [];
}
/** "someone matching … is ON <object> in my room" clues, top-level or inside an AND. */
function roomExistsList(clue: Clue): RoomExistsClue[] {
  if (clue instanceof RoomExistsClue) return [clue];
  if (clue instanceof AndClue) return clue.clues.flatMap(roomExistsList);
  return [];
}

interface Demand {
  cells: Cell[];
}

/**
 * Pigeonhole on an occupiable object type (chairs, cars, …). Several DISTINCT people are
 * provably ON the object:
 *  - each suspect with an `on <object>` clue (a concrete person, confined to their object cells);
 *  - the occupant guaranteed by a `roomExists(matching … on <object>)` clue — an ANONYMOUS
 *    distinct person confined, over ALL of the subject's still-possible rooms, to the
 *    matcher-reachable object cells (counted only when provably distinct from the on-object
 *    suspects, and at most one, so the demand people are certainly distinct).
 * Since everyone occupies a distinct row AND column, these demand people need a non-attacking
 * placement onto object cells. An object cell whose occupation (by anyone) would leave them
 * unplaceable therefore stays EMPTY.
 *
 * Runs LATE (after the room/companion reasoning): those techniques first pin who is in which
 * room, which sharpens the anonymous occupant's cells; firing earlier would race them and,
 * being non-confluent with the heuristic case splits, could push a level onto a worse path.
 *
 * Example (museum): Brenda is on a chair; Elsa's clue puts a MALE on a chair in her room, and
 * over Elsa's possible rooms that man is confined to two row-7 chairs. With Brenda they need
 * two non-attacking chairs among {Z7/S3, Z7/S6, Z8/S3}; Z7/S3 attacks both others ⇒ Z7/S3 empty.
 */
export class ObjectPigeonholeTechnique extends Technique {
  readonly name = "objectPigeonhole";
  readonly difficulty = 5;

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.suspects.some((s) =>
      s.clues.some(
        (c) => onObjectList(c).length > 0 || roomExistsList(c).some((re) => re.relation === "on"),
      ),
    );
  }

  apply(ctx: SolveContext): DeductionStep | null {
    const types = new Set<string>();
    for (const s of ctx.puzzle.suspects) {
      for (const clue of s.clues) {
        for (const oc of onObjectList(clue)) types.add(oc.object);
        for (const re of roomExistsList(clue)) if (re.relation === "on") types.add(re.object);
      }
    }
    for (const object of types) {
      const step = this.applyType(ctx, object);
      if (step) return step;
    }
    return null;
  }

  private applyType(ctx: SolveContext, object: string): DeductionStep | null {
    const board = ctx.board;
    const objCells = board.cellsWithObject(object);
    if (objCells.size === 0) return null;
    const rc = (c: Cell) => board.rc(c);

    const demands: Demand[] = [];
    const onObjSuspects: PersonId[] = [];
    // (1) suspects forced ONTO the object (unplaced) — concrete demand people.
    for (const s of ctx.puzzle.suspects) {
      if (ctx.state.placed.has(s.id)) continue;
      if (!s.clues.some((c) => onObjectList(c).some((oc) => oc.object === object))) continue;
      const cells = [...ctx.state.domain(s.id)].filter((c) => objCells.has(c));
      if (cells.length === 0) return null; // on-object suspect with no object cell → nothing sound to do
      demands.push({ cells });
      onObjSuspects.push(s.id);
    }
    // (2) at most ONE anonymous occupant from a `roomExists(… on object)` clue — so the demand
    //     people stay certainly distinct (a second anonymous one might be the same person).
    let anonAdded = false;
    for (const e of ctx.puzzle.suspects) {
      if (anonAdded) break;
      for (const re of e.clues.flatMap(roomExistsList)) {
        if (re.relation !== "on" || re.object !== object) continue;
        // Distinct from every on-object suspect (none of them could BE this occupant).
        if (onObjSuspects.some((id) => re.matchesPerson(ctx.puzzle, id))) continue;
        const eCells = ctx.state.placed.has(e.id)
          ? [ctx.state.placed.get(e.id)!]
          : [...ctx.state.domain(e.id)];
        const rooms = new Set(eCells.map((c) => board.roomIdOf(c)));
        // The occupant is a matching SUSPECT (never the victim, never the subject).
        const matchers = ctx.puzzle.suspects.filter(
          (m) => m.id !== e.id && re.matchesPerson(ctx.puzzle, m.id),
        );
        if (matchers.length === 0) continue;
        const mCells: Cell[] = [];
        for (const c of objCells) {
          if (!rooms.has(board.roomIdOf(c))) continue;
          const reachable = matchers.some((m) =>
            ctx.state.placed.has(m.id)
              ? ctx.state.placed.get(m.id) === c
              : ctx.state.domain(m.id).has(c),
          );
          if (reachable) mCells.push(c);
        }
        if (mCells.length > 0) {
          demands.push({ cells: mCells });
          anonAdded = true;
          break;
        }
      }
    }

    if (demands.length < 2) return null;

    // Exists a non-attacking (distinct row AND column) placement of `people` onto their cells,
    // none matching `forb`? The demand sets are tiny, so plain backtracking.
    const feasible = (people: Demand[], forb: (c: Cell) => boolean): boolean => {
      const go = (i: number, rows: Set<number>, cols: Set<number>): boolean => {
        if (i === people.length) return true;
        for (const c of people[i].cells) {
          if (forb(c)) continue;
          const { row, col } = rc(c);
          if (rows.has(row) || cols.has(col)) continue;
          rows.add(row);
          cols.add(col);
          if (go(i + 1, rows, cols)) {
            rows.delete(row);
            cols.delete(col);
            return true;
          }
          rows.delete(row);
          cols.delete(col);
        }
        return false;
      };
      return go(0, new Set(), new Set());
    };

    const occupied = new Set(ctx.state.placed.values());
    for (const c0 of objCells) {
      if (occupied.has(c0)) continue;
      if (!ctx.state.unplaced().some((id) => ctx.state.domain(id).has(c0))) continue;
      const { row, col } = rc(c0);
      const forb = (c: Cell) => c === c0 || rc(c).row === row || rc(c).col === col;
      // A non-demand on c0: the demand people must all fit while avoiding c0's row/column.
      if (feasible(demands, forb)) continue;
      // A demand person themselves on c0: the REST must fit while avoiding it.
      let canOccupy = false;
      for (let i = 0; i < demands.length; i++) {
        if (!demands[i].cells.includes(c0)) continue;
        if (
          feasible(
            demands.filter((_, j) => j !== i),
            forb,
          )
        ) {
          canOccupy = true;
          break;
        }
      }
      if (canOccupy) continue;
      // Nobody can be on c0 → it stays empty.
      const eliminated: Elimination[] = [];
      for (const id of ctx.state.unplaced()) {
        const removed = ctx.removeWhere(id, (c) => c === c0);
        if (removed.length > 0) eliminated.push({ personId: id, cells: removed });
      }
      if (eliminated.length > 0) {
        return {
          technique: "objectPigeonhole",
          eliminated,
          explanation: {
            key: "step.objectPigeonhole",
            params: { object, count: demands.length, cell: c0 },
          },
        };
      }
    }
    return null;
  }
}
