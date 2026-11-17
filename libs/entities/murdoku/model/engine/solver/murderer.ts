import { VICTIM_ID } from "../domain/types.ts";
import type { PersonId } from "../domain/types.ts";
import type { Puzzle } from "../domain/Puzzle.ts";
import type { Solution } from "../domain/Solution.ts";

export interface MurdererResult {
  /** The unique suspect alone with the victim, or null if not exactly one. */
  suspectId: PersonId | null;
  roomId: string;
  suspectsInRoom: PersonId[];
}

/** The murderer is the single suspect sharing the victim's room. */
export function findMurderer(puzzle: Puzzle, solution: Solution): MurdererResult {
  const board = puzzle.board;
  const roomId = board.roomIdOf(solution.cellOf(VICTIM_ID));
  const suspectsInRoom = puzzle.suspects
    .filter((s) => board.roomIdOf(solution.cellOf(s.id)) === roomId)
    .map((s) => s.id);
  return {
    suspectId: suspectsInRoom.length === 1 ? suspectsInRoom[0] : null,
    roomId,
    suspectsInRoom,
  };
}
