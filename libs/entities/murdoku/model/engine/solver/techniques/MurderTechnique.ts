import { Technique } from "./Technique.ts";
import { VICTIM_ID, type Cell, type PersonId } from "../../domain/types.ts";
import type { Axis, SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";

/**
 * The core rule of every case: the victim was ALONE with the murderer, so exactly
 * one suspect shares the victim's room. Three sound, readable deductions:
 *  - a room already holding ≥2 sure suspects can't be the victim's room;
 *  - once the victim's room is known, a suspect sure to be there IS the murderer,
 *    so every other suspect leaves that room;
 *  - if only one suspect can be in the victim's room, that suspect must be there.
 */
export class MurderTechnique extends Technique {
  readonly name = "murderRule";
  readonly difficulty = 5;

  apply(ctx: SolveContext): DeductionStep | null {
    const suspects = ctx.puzzle.suspects.map((s) => s.id);
    /** The single room a person is confined to (placed cell or whole domain), else null. */
    const sole = (id: PersonId): string | null => {
      const rooms = ctx.roomsOf(id);
      return rooms.size === 1 ? [...rooms][0] : null;
    };
    const victimRoom = sole(VICTIM_ID);

    // --- victim's room is known -------------------------------------------
    if (victimRoom) {
      // A suspect sure to be there is the murderer → every other suspect leaves it.
      const murderer = suspects.find((id) => sole(id) === victimRoom);
      if (murderer) {
        const eliminated: Elimination[] = [];
        for (const other of ctx.state.unplaced()) {
          if (other === murderer || other === VICTIM_ID) continue;
          const removed = ctx.removeWhere(other, (c) => ctx.roomOf(c) === victimRoom);
          if (removed.length > 0) eliminated.push({ personId: other, cells: removed });
        }
        if (eliminated.length > 0) {
          return {
            technique: "murderRule",
            personId: murderer,
            eliminated,
            explanation: {
              key: "step.murderIdentified",
              params: { name: murderer, room: victimRoom },
            },
          };
        }
      }
      // Only one suspect can even be there → that suspect must be the murderer.
      const canBeThere = suspects.filter((id) => ctx.roomsOf(id).has(victimRoom));
      if (canBeThere.length === 1 && !ctx.state.placed.has(canBeThere[0])) {
        const id = canBeThere[0];
        const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) !== victimRoom);
        if (removed.length > 0) {
          return {
            technique: "murderRule",
            personId: id,
            eliminated: [{ personId: id, cells: removed }],
            explanation: { key: "step.murderConfine", params: { name: id, room: victimRoom } },
          };
        }
      }
    }

    // --- a room with ≥2 sure suspects can't be the victim's room ----------
    if (!ctx.state.placed.has(VICTIM_ID)) {
      const sureCount = new Map<string, number>();
      for (const id of suspects) {
        const room = sole(id);
        if (room) sureCount.set(room, (sureCount.get(room) ?? 0) + 1);
      }
      for (const [room, count] of sureCount) {
        if (count < 2) continue;
        const removed = ctx.removeWhere(VICTIM_ID, (c) => ctx.roomOf(c) === room);
        if (removed.length > 0) {
          return {
            technique: "murderRule",
            personId: VICTIM_ID,
            eliminated: [{ personId: VICTIM_ID, cells: removed }],
            explanation: { key: "step.murderVictimNotRoom", params: { room, count } },
          };
        }
      }
    }

    const fill = this.applyRoomFill(ctx);
    if (fill) return fill;
    return this.applyFeasibility(ctx);
  }

  /**
   * Direct murder-rule elimination ("…sonst hätte das Opfer keinen Mörder mehr"): a cell
   * is impossible if PLACING someone there would leave the victim unable to be alone with
   * EXACTLY ONE suspect. One tentative placement, one feasibility look — no propagation
   * chain, so it stays the kind of single-step rule check a player makes by hand, not a
   * trial. Bounded so it can't blow up on big boards.
   */
  private applyFeasibility(ctx: SolveContext): DeductionStep | null {
    const order = [...ctx.state.unplaced()].sort(
      (a, b) => ctx.state.domain(a).size - ctx.state.domain(b).size,
    );
    let budget = 48;
    for (const id of order) {
      const cells = [...ctx.state.domain(id)];
      if (cells.length < 2 || budget - cells.length < 0) {
        if (cells.length >= 2) break;
        continue;
      }
      budget -= cells.length;
      const bad = cells.filter((c) => {
        const trial = ctx.clone();
        trial.place(id, c);
        return !trial.murderPossible();
      });
      // Keep at least one cell — all-bad would be a contradiction, handled elsewhere.
      if (bad.length === 0 || bad.length === cells.length) continue;
      const removed = ctx.removeWhere(id, (c) => bad.includes(c));
      if (removed.length > 0) {
        return {
          technique: "murderRule",
          personId: id,
          eliminated: [{ personId: id, cells: removed }],
          explanation: {
            key: ctx.isVictim(id) ? "step.murderNoVictimCell" : "step.murderNoMurderer",
            params: { name: id },
          },
        };
      }
    }
    return null;
  }

  /**
   * Occupancy from the murder rule in a TWO-room, full-permutation case: the victim's
   * room holds exactly 2 (victim + murderer), so the other room holds the remaining
   * N−2 — i.e. the rooms hold {2, N−2}. When that forces a room to exactly its capacity
   * it is FULL: every row/column it spans is used, so a line with a single cell must be
   * occupied. If only one person can sit there, they must. (E.g. the Lager spans columns
   * 3 & 4 and rows 1 & 2 and must hold 2 people → its only column-3 cell is Anna's.)
   */
  private applyRoomFill(ctx: SolveContext): DeductionStep | null {
    if (!ctx.fullPermutation || ctx.state.placed.has(VICTIM_ID)) return null;
    const cellsByRoom = new Map<string, Cell[]>();
    for (const cell of ctx.board.occupiableCells()) {
      const room = ctx.roomOf(cell);
      const list = cellsByRoom.get(room) ?? cellsByRoom.set(room, []).get(room)!;
      list.push(cell);
    }
    if (cellsByRoom.size !== 2) return null;
    const n = ctx.puzzle.people().length;
    for (const [room, cells] of cellsByRoom) {
      const cap = ctx.roomsCapacity([room]);
      const occ = [2, n - 2].filter((o, i, a) => o >= 0 && o <= cap && a.indexOf(o) === i);
      if (occ.length !== 1 || occ[0] !== cap) continue; // room's occupancy is uniquely its (full) capacity
      for (const axis of ["row", "col"] as Axis[]) {
        const byLine = new Map<number, Cell[]>();
        for (const cell of cells) {
          const line = ctx.axisOf(cell, axis);
          const list = byLine.get(line) ?? byLine.set(line, []).get(line)!;
          list.push(cell);
        }
        if (byLine.size !== cap) continue; // not every line of this axis is forced in use
        for (const lineCells of byLine.values()) {
          if (lineCells.length !== 1) continue; // a single-cell line in a full room → occupied
          const cell = lineCells[0];
          const occupants = ctx.puzzle
            .people()
            .map((p) => p.id)
            .filter((id) => ctx.cellsOf(id).includes(cell));
          if (occupants.length !== 1 || ctx.state.placed.has(occupants[0])) continue;
          const id = occupants[0];
          const removed = ctx.removeWhere(id, (c) => c !== cell);
          if (removed.length > 0) {
            return {
              technique: "murderRule",
              personId: id,
              eliminated: [{ personId: id, cells: removed }],
              explanation: { key: "step.murderRoomFill", params: { name: id, room } },
            };
          }
        }
      }
    }
    return null;
  }
}
