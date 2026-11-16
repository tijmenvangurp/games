import type { RoundSummary } from "@entities/adaptive";
import type { Puzzle } from "@entities/murdoku";
import type { MurdokuPlayState, MurdokuText } from "@features/murdoku-game";

/** De Nederlandse afloopzin: wie was als enige bij de buit? */
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

/**
 * De rustige uitleg na een zaak. Het niveau gaat per zaak één stap op of neer;
 * de tekst vertelt dat zonder score, sterren of verwijt.
 */
export function progressSentenceFor(lastRound: RoundSummary | null): string | null {
  if (!lastRound || lastRound.delta === 0) return null;
  if (lastRound.delta > 0) {
    return "Je had hooguit één aanwijzing nodig. De volgende zaak mag een maatje groter.";
  }
  return "Deze zaak was pittig. De volgende keer pakken we een rustiger zaak; je kunt deze altijd opnieuw proberen.";
}
