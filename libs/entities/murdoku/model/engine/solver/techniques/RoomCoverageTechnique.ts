import { Technique } from "./Technique.ts";
import { EmptyRoomsClue } from "../../clues/boardClues.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { PersonId } from "../../domain/types.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

/**
 * "No empty rooms" + as many suspects as rooms ⇒ each room holds exactly one suspect.
 * (The victim only ever shares the murderer's room — the murder rule — so every room
 * still needs a suspect of its own; equal counts force a 1-to-1 match.) That turns the
 * rooms into a Sudoku-like unit over the suspects:
 *  - a suspect confined to one room reserves it (no other suspect may enter);
 *  - a room only one suspect can still reach confines that suspect to it.
 * Purely forward and sound — it only ever fires when the bijection provably holds.
 */
export class RoomCoverageTechnique extends Technique {
  readonly name = "roomCoverage";
  readonly difficulty = 4;

  override relevant(puzzle: Puzzle): boolean {
    return this.applies(puzzle);
  }

  /** The bijection holds: a "0 empty rooms" clue and one room per suspect. */
  private applies(puzzle: Puzzle): boolean {
    const noEmpty = puzzle.boardClues.some((c) => c instanceof EmptyRoomsClue && c.count === 0);
    return noEmpty && puzzle.board.rooms.size === puzzle.suspects.length;
  }

  apply(ctx: SolveContext): DeductionStep | null {
    if (!this.applies(ctx.puzzle)) return null;
    const suspects = new Set(ctx.puzzle.suspects.map((s) => s.id));

    // The room each suspect is certainly in (placed cell, or whole domain in one room).
    const certain = new Map<PersonId, string>();
    for (const id of suspects) {
      const placed = ctx.state.placed.get(id);
      if (placed !== undefined) certain.set(id, ctx.roomOf(placed));
      else {
        const room = ctx.guaranteedRoomOf(id);
        if (room) certain.set(id, room);
      }
    }

    // (1) A suspect's room is theirs alone — every OTHER suspect leaves it.
    for (const [sid, room] of certain) {
      const eliminated: Elimination[] = [];
      for (const other of ctx.state.unplaced()) {
        if (other === sid || !suspects.has(other) || certain.get(other) === room) continue;
        const removed = ctx.removeWhere(other, (c) => ctx.roomOf(c) === room);
        if (removed.length > 0) eliminated.push({ personId: other, cells: removed });
      }
      if (eliminated.length > 0) {
        return {
          technique: "roomCoverage",
          personId: sid,
          eliminated,
          explanation: { key: "step.roomCoverageReserve", params: { name: sid, room } },
        };
      }
    }

    // (2) A room only one suspect can still reach must hold that suspect.
    const taken = new Set(certain.values());
    for (const room of ctx.puzzle.board.rooms.keys()) {
      if (taken.has(room)) continue;
      const possible = [...ctx.state.unplaced()].filter(
        (id) => suspects.has(id) && [...ctx.state.domain(id)].some((c) => ctx.roomOf(c) === room),
      );
      if (possible.length === 1) {
        const id = possible[0];
        const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) !== room);
        if (removed.length > 0) {
          return {
            technique: "roomCoverage",
            personId: id,
            eliminated: [{ personId: id, cells: removed }],
            explanation: { key: "step.roomCoverageConfine", params: { name: id, room } },
          };
        }
      }
    }
    return null;
  }
}
