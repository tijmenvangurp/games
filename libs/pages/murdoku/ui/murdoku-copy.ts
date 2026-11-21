import type { RoundSummary } from "@entities/adaptive";
import type { Puzzle } from "@entities/murdoku";
import type { MurdokuPlayState, MurdokuText } from "@features/murdoku-game";
import { MURDOKU_PAGE_TEXTS } from "./texts";

/** De vaste teksten van de pagina in één taal. */
type MurdokuPageTexts = (typeof MURDOKU_PAGE_TEXTS)["nl"];

/** De afloopzin: wie was als enige bij de buit? */
export function revealSentenceFor(
  puzzle: Puzzle,
  text: MurdokuText,
  play: MurdokuPlayState,
  t: MurdokuPageTexts,
): string | null {
  const resolution = play.resolution;
  if (!resolution) return null;
  const nameKey = puzzle.board.rooms.get(resolution.roomId)?.nameKey ?? resolution.roomId;
  return t.reveal(
    puzzle.nameOf(resolution.murdererId),
    puzzle.victim.name,
    text.roomName(nameKey),
    text.roomPhrase(resolution.roomId),
  );
}

/** De melding onder het bord: neutraal bij een fout, vierend bij een oplossing. */
export function feedbackFor(
  play: MurdokuPlayState,
  revealSentence: string | null,
  t: MurdokuPageTexts,
): string | null {
  if (play.phase === "solved" && revealSentence) {
    return t.solved(revealSentence);
  }
  if (play.wrongCheck) {
    return t.wrong;
  }
  return null;
}

/**
 * De rustige uitleg na een zaak. Het niveau gaat per zaak één stap op of neer;
 * de tekst vertelt dat zonder score, sterren of verwijt.
 */
export function progressSentenceFor(
  lastRound: RoundSummary | null,
  t: MurdokuPageTexts,
): string | null {
  if (!lastRound || lastRound.delta === 0) return null;
  if (lastRound.delta > 0) {
    return t.levelUp;
  }
  return t.levelDown;
}
