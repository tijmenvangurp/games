import {
  fourInARowLabels,
  winnerOf,
  type FourInARowGame,
  type FourInARowMode,
  type Player,
} from "@entities/four-in-a-row";
import { getTexts } from "@shared/i18n";
import { fourInARowTexts } from "./texts";

/** Spelersnamen zoals het kind ze ziet; bij de computer heet speler een "Jij". */
export function playerName(player: Player, mode: FourInARowMode): string {
  const t = getTexts(fourInARowTexts);
  if (mode === "computer") {
    return player === "one" ? t.you : t.computer;
  }
  return getTexts(fourInARowLabels).players[player];
}

export function standText(score: Record<Player, number>, mode: FourInARowMode): string {
  return `${playerName("one", mode)} ${score.one} – ${playerName("two", mode)} ${score.two}`;
}

function winText(winner: Player, mode: FourInARowMode): string {
  const t = getTexts(fourInARowTexts);
  if (mode === "computer") {
    return t.computerWins[winner];
  }
  return t.playerWins(playerName(winner, mode));
}

export function winTitle(winner: Player, mode: FourInARowMode): string {
  const t = getTexts(fourInARowTexts);
  if (mode === "computer") {
    return t.computerTitle[winner];
  }
  return t.playerTitle(playerName(winner, mode));
}

export function statusText(game: FourInARowGame, mode: FourInARowMode): string {
  const t = getTexts(fourInARowTexts);
  if (game.draw) {
    return t.draw;
  }

  const winner = winnerOf(game);
  if (winner) {
    return winText(winner, mode);
  }

  if (mode === "computer" && game.current === "two") {
    return t.thinking;
  }

  if (game.drops.length === 0) {
    return t.starts(playerName(game.current, mode));
  }

  if (mode === "computer" && game.current === "one") {
    return t.yourTurn;
  }

  return t.turn(playerName(game.current, mode));
}
