import {
  PLAYER_INFO,
  winnerOf,
  type FourInARowGame,
  type FourInARowMode,
  type Player,
} from "@entities/four-in-a-row";

/** Spelersnamen zoals het kind ze ziet; bij de computer heet speler een "Jij". */
export function playerName(player: Player, mode: FourInARowMode): string {
  if (mode === "computer") {
    return player === "one" ? "Jij" : "Computer";
  }
  return PLAYER_INFO[player].label;
}

export function standText(score: Record<Player, number>, mode: FourInARowMode): string {
  return `${playerName("one", mode)} ${score.one} – ${playerName("two", mode)} ${score.two}`;
}

function winText(winner: Player, mode: FourInARowMode): string {
  if (mode === "computer") {
    return winner === "one" ? "Jij hebt vier op een rij!" : "De computer heeft vier op een rij!";
  }
  return `${PLAYER_INFO[winner].label} heeft vier op een rij!`;
}

export function winTitle(winner: Player, mode: FourInARowMode): string {
  if (mode === "computer") {
    return winner === "one" ? "Jij wint!" : "De computer wint!";
  }
  return `${PLAYER_INFO[winner].label} wint!`;
}

export function statusText(game: FourInARowGame, mode: FourInARowMode): string {
  if (game.draw) {
    return "Het bord is vol: gelijkspel!";
  }

  const winner = winnerOf(game);
  if (winner) {
    return winText(winner, mode);
  }

  if (mode === "computer" && game.current === "two") {
    return "De computer denkt na…";
  }

  if (game.drops.length === 0) {
    return `${playerName(game.current, mode)} begint. Tik op een kolom om je schijf te laten vallen.`;
  }

  if (mode === "computer" && game.current === "one") {
    return "Jij bent aan de beurt.";
  }

  return `${playerName(game.current, mode)} is aan de beurt.`;
}
