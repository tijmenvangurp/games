import { Technique } from "./Technique.ts";
import { RoomCompanionClue, RoomExistsClue } from "../../clues/socialClues.ts";
import { AndClue } from "../../clues/compositeClues.ts";
import type { Clue } from "../../clues/Clue.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { AttributeValue, PersonId } from "../../domain/types.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

interface Demand {
  attribute: string;
  value: AttributeValue;
  /** Exclusive demanders ("alone with a matching person") — their room holds nobody else. */
  exclusive: PersonId[];
  /** Non-exclusive demanders ("a matching person was in my room"). */
  shared: PersonId[];
}

function clueList<T extends Clue>(clue: Clue, is: (c: Clue) => c is T): T[] {
  if (is(clue)) return [clue];
  if (clue instanceof AndClue) return clue.clues.flatMap((c) => clueList(c, is));
  return [];
}
const isCompanion = (c: Clue): c is RoomCompanionClue => c instanceof RoomCompanionClue;
const isExists = (c: Clue): c is RoomExistsClue => c instanceof RoomExistsClue;

/**
 * Multi-person matching / pigeonhole over a SCARCE attribute (e.g. "men"). Several
 * suspects each need a person matching X in their room, in rooms that must be DISTINCT
 * (an "alone-with-X" room holds nobody else; a "someone-X-in-room" suspect can't enter
 * such a room). If exactly as many X-people can still reach those rooms as there are
 * such suspects, every one of those X-people is CONFINED to that set of rooms — none is
 * left over for anywhere else. ("Brenda & Elsa brauchen je einen Mann in getrennten
 * Räumen; nur G & D können dort hin → G & D sind auf {Café,Lobby,Security} festgelegt.")
 *
 * Sound: only fires when the demanders provably occupy distinct rooms (all exclusive, or
 * at most one shared added) and the matching supply is exactly tight.
 */
export class CompanionPairingTechnique extends Technique {
  readonly name = "companionPairing";
  readonly difficulty = 5;

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.suspects.some((s) =>
      s.clues.some((c) => clueList(c, isCompanion).length + clueList(c, isExists).length > 0),
    );
  }

  apply(ctx: SolveContext): DeductionStep | null {
    const victim = ctx.puzzle.victim.id;
    for (const demand of this.demands(ctx)) {
      const { attribute, value } = demand;
      // The victim could itself satisfy a "someone X in my room" demand — to stay sound,
      // skip the whole demand if the victim matches the attribute.
      if (ctx.puzzle.attributesOf(victim)[attribute] === value) continue;

      // Distinct-room demander set: all exclusive ones, plus at most one shared one
      // (two shared demanders might share a room, so we can't assume they're distinct).
      const consumers =
        demand.shared.length <= 1 ? [...demand.exclusive, ...demand.shared] : [...demand.exclusive];
      // A consumer counts ONLY if it still needs a fresh (unplaced) matching person — i.e.
      // no ALREADY-PLACED matching person could be in any room the consumer could occupy.
      // (Otherwise that placed person can satisfy it, and it consumes no supplier — counting
      // it would wrongly inflate the demand and over-confine the remaining suppliers.)
      const placedSatisfies = (id: PersonId): boolean => {
        const rooms = ctx.roomsOf(id);
        for (const [pid, pcell] of ctx.state.placed) {
          if (pid === victim || pid === id) continue;
          if (
            ctx.puzzle.attributesOf(pid)[attribute] === value &&
            rooms.has(ctx.board.roomIdOf(pcell))
          ) {
            return true;
          }
        }
        return false;
      };
      const open = consumers.filter((id) => !ctx.state.placed.has(id) && !placedSatisfies(id));
      if (open.length < 2) continue;

      const consumerRooms = new Set<string>();
      for (const id of open) for (const r of ctx.roomsOf(id)) consumerRooms.add(r);

      const suppliers = ctx.state
        .unplaced()
        .filter(
          (id) =>
            id !== victim && !open.includes(id) && ctx.puzzle.attributesOf(id)[attribute] === value,
        );
      const available = suppliers.filter((id) =>
        [...ctx.roomsOf(id)].some((r) => consumerRooms.has(r)),
      );
      // Exactly as many suppliers can reach the demander rooms as there are demanders →
      // every one of them is used there, so none may stand outside those rooms.
      if (available.length !== open.length) continue;

      const eliminated: Elimination[] = [];
      for (const id of available) {
        const removed = ctx.removeWhere(id, (c) => !consumerRooms.has(ctx.board.roomIdOf(c)));
        if (removed.length > 0) eliminated.push({ personId: id, cells: removed });
      }
      if (eliminated.length > 0) {
        return {
          technique: "companionPairing",
          eliminated,
          explanation: {
            key: "step.companionPairing",
            params: { people: available.join(","), count: open.length, attribute },
          },
        };
      }
    }
    return null;
  }

  /** Collect, per (attribute,value), the exclusive ("alone with") and shared
   *  ("someone in room") demanders among the suspects. */
  private demands(ctx: SolveContext): Demand[] {
    const map = new Map<string, Demand>();
    const get = (attribute: string, value: AttributeValue): Demand => {
      const key = `${attribute}=${String(value)}`;
      let d = map.get(key);
      if (!d) map.set(key, (d = { attribute, value, exclusive: [], shared: [] }));
      return d;
    };
    for (const s of ctx.puzzle.suspects) {
      for (const c of s.clues) {
        // Only single-companion demands ("alone with exactly ONE matching person") fit the
        // one-supplier-per-room pigeonhole below; an "alone with N" demand needs N suppliers
        // in the SAME room, which this technique doesn't model, so skip it (CompanionRoomFit
        // and the room-reasoning force/reserve rules handle counted companions soundly).
        for (const comp of clueList(c, isCompanion)) {
          if (comp.count === 1) get(comp.attribute, comp.value).exclusive.push(s.id);
        }
        for (const ex of clueList(c, isExists)) {
          if (ex.attribute) get(ex.attribute, ex.value).shared.push(s.id);
        }
      }
    }
    return [...map.values()];
  }
}
