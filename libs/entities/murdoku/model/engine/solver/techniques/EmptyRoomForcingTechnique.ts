import { Technique } from "./Technique.ts";
import { EmptyRoomsClue } from "../../clues/boardClues.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { Cell, PersonId } from "../../domain/types.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

/**
 * "Which room stays empty?" — the deduction a human makes straight from a "N rooms empty"
 * clue when a room can only be reached by very few suspects: try seating a possible occupant
 * there and follow the consequences; if EVERY seating runs into a dead end, nobody can be in
 * the room, so it is one of the empty ones.
 *
 * Concretely, for a room only a handful of (suspect, cell) placements could fill, each is
 * tried on a copy and the base rules are propagated to a fixpoint. If they all reach a
 * contradiction (an empty domain, an unfillable row/column, or the victim left without a
 * possible murderer), no suspect can occupy the room — and the victim never sits alone — so
 * the room is empty and is crossed out for everyone.
 *
 * This is a bounded, room-focused contradiction ("könnte die Garage belegt sein? Nein, dann
 * geht Spalte 9 nicht mehr auf → sie ist leer"), not an open-ended search: only rooms with a
 * small number of possible occupants are probed, so every argument stays short.
 */
export class EmptyRoomForcingTechnique extends Technique {
  readonly name = "emptyRoomForcing";
  readonly difficulty = 5;

  /** At most this many hypothetical seatings per room — a human only weighs the few suspects
   *  that could actually be in the room, so keep the breadth small. */
  private static readonly MAX_SEATS = 6;

  /**
   * @param base   the obvious forward rules propagated inside the hypothesis.
   * @param maxSteps Follow-through budget: after the ONE tentative placement, at most this
   *  many OBVIOUS rule-steps may fire before the contradiction must show. Kept TINY (2) —
   *  "setz die eine Person, dann sieht man's nach 1–2 Schritten"; nobody thinks 5 steps deep,
   *  that would be guessing. A room whose contradiction needs more is simply NOT ruled empty.
   */
  constructor(
    private readonly base: Technique[],
    private readonly maxSteps = 2,
  ) {
    super();
  }

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.boardClues.some((c) => c instanceof EmptyRoomsClue && c.count >= 1);
  }

  apply(ctx: SolveContext): DeductionStep | null {
    for (const room of ctx.board.rooms.keys()) {
      // A room already guaranteed to hold a suspect can't be the empty one.
      const guaranteed =
        ctx.puzzle.suspects.some((s) => {
          const rooms = ctx.roomsOf(s.id);
          return rooms.size === 1 && [...rooms][0] === room;
        }) ||
        [...ctx.state.placed].some(
          ([id, c]) => id !== ctx.puzzle.victim.id && ctx.roomOf(c) === room,
        );
      if (guaranteed) continue;

      const seats: { id: PersonId; cell: Cell }[] = [];
      for (const s of ctx.puzzle.suspects) {
        if (ctx.state.placed.has(s.id)) continue;
        for (const cell of ctx.state.domain(s.id)) {
          if (ctx.roomOf(cell) === room) seats.push({ id: s.id, cell });
        }
      }
      if (seats.length === 0) continue; // no suspect can reach it anyway (EmptyRooms handles)
      if (seats.length > EmptyRoomForcingTechnique.MAX_SEATS) continue; // too broad to probe

      // If ANY seating survives, the room can be occupied → no conclusion.
      const canOccupy = seats.some(({ id, cell }) => {
        const trial = ctx.clone();
        trial.place(id, cell);
        return !this.runsDead(trial);
      });
      if (canOccupy) continue;

      // Every way to occupy the room dies ⇒ it is empty. Nobody (suspect or victim, who
      // never sits alone) may be there.
      const eliminated: Elimination[] = [];
      for (const id of ctx.state.unplaced()) {
        const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room);
        if (removed.length > 0) eliminated.push({ personId: id, cells: removed });
      }
      if (eliminated.length > 0) {
        return {
          technique: "emptyRoomForcing",
          eliminated,
          explanation: { key: "step.emptyRoomForcing", params: { room } },
        };
      }
    }
    return null;
  }

  /** Propagate the base rules on a copy to a fixpoint (bounded); true if it hits a
   *  contradiction. */
  private runsDead(trial: SolveContext): boolean {
    for (let step = 0; step < this.maxSteps; step++) {
      if (trial.deadReason()) return true;
      let progressed = false;
      for (const technique of this.base) {
        if (technique.apply(trial)) {
          progressed = true;
          break;
        }
      }
      if (!progressed) break;
    }
    return trial.deadReason() !== null;
  }
}
