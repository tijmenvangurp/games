import type { Puzzle } from "@entities/murdoku";
import type { MurdokuPlayState, MurdokuText } from "@features/murdoku-game";

/** De Nederlandse afloopzin: wie was als enige bij het slachtoffer? */
export function revealSentenceFor(
  puzzle: Puzzle,
  text: MurdokuText,
  play: MurdokuPlayState,
): string | null {
  const resolution = play.resolution;
  if (!resolution) return null;
  const nameKey = puzzle.board.rooms.get(resolution.roomId)?.nameKey ?? resolution.roomId;
  return `${puzzle.nameOf(resolution.murdererId)} was als enige bij ${puzzle.victim.name} in de ${text.roomName(nameKey)}.`;
}

/** De melding onder het bord: neutraal bij een fout, vierend bij een oplossing. */
export function feedbackFor(play: MurdokuPlayState, revealSentence: string | null): string | null {
  if (play.phase === "solved" && revealSentence) {
    return `Opgelost! ${revealSentence}`;
  }
  if (play.wrongCheck) {
    return "Nog niet helemaal. Kijk nog eens naar de aanwijzingen en probeer het opnieuw.";
  }
  return null;
}
