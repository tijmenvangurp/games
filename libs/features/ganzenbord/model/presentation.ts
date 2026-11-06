import {
  PLAYER_IDS,
  isFinished,
  type GanzenbordGame,
  type PlayerId,
  type PlayerState,
  type TurnEvent,
} from "@entities/ganzenbord";

export function playerNumber(id: PlayerId): number {
  return PLAYER_IDS.indexOf(id) + 1;
}

export function playerName(player: Pick<PlayerState, "id" | "controller">): string {
  return player.controller === "computer"
    ? `Computer ${playerNumber(player.id)}`
    : `Speler ${playerNumber(player.id)}`;
}

/** Korte naam voor de spelerskaarten; "Computer 2" wordt daar afgekapt. */
export function playerShortName(player: Pick<PlayerState, "id" | "controller">): string {
  return player.controller === "computer"
    ? `CPU ${playerNumber(player.id)}`
    : `Speler ${playerNumber(player.id)}`;
}

function nameOf(game: GanzenbordGame, id: PlayerId): string {
  const player = game.players.find((candidate) => candidate.id === id);
  return player ? playerName(player) : `Speler ${playerNumber(id)}`;
}

export function playerColorClass(id: PlayerId): string {
  return {
    one: "bg-player-one",
    two: "bg-player-two",
    three: "bg-player-three",
    four: "bg-player-four",
  }[id];
}

export function positionText(player: PlayerState): string {
  if (player.position >= 63) {
    return "Bij de finish";
  }
  if (player.stuckOn === 31) {
    return "Zit in de put";
  }
  if (player.stuckOn === 52) {
    return "Zit in de gevangenis";
  }
  if (player.skipTurns > 0) {
    return "Slaat een beurt over";
  }
  return player.position === 0 ? "Bij start" : `Vak ${player.position}`;
}

const SIMPLE_EVENT_TEXT: Partial<Record<TurnEvent["kind"], string>> = {
  bridge: "Brug: door naar 12.",
  inn: "Herberg: één beurt overslaan.",
  well: "In de put! Wacht tot iemand je aflost.",
  prison: "Gevangenis! Wacht tot iemand je aflost.",
  maze: "Doolhof: terug naar 37.",
  death: "Dood: terug naar start.",
};

function eventText(game: GanzenbordGame, event: TurnEvent): string | null {
  if (event.kind === "first-throw") {
    return `Eerste worp 9: meteen naar ${event.to}.`;
  }
  if (event.kind === "bounce") {
    return `Voorbij 63: terug naar ${event.to}.`;
  }
  if (event.kind === "goose") {
    return `Gans! Naar ${event.to}.`;
  }
  if (event.kind === "free") {
    return `${nameOf(game, event.player)} komt vrij!`;
  }
  if (event.kind === "skip") {
    return `${nameOf(game, event.player)} slaat een beurt over.`;
  }
  return SIMPLE_EVENT_TEXT[event.kind] ?? null;
}

/**
 * Een korte, leesbare samenvatting van de laatste beurt. De volledige
 * gebeurtenissenlijst is te lang voor de statusbalk; de worp en de belangrijkste
 * twee gebeurtenissen zijn genoeg.
 */
export function turnText(game: GanzenbordGame, events: readonly TurnEvent[]): string {
  if (game.status === "draw") {
    return "Gelijkspel: iedereen zit vast.";
  }
  if (game.status === "finished" && game.winner) {
    return `${nameOf(game, game.winner)} wint!`;
  }

  const roll = events.find((event) => event.kind === "roll");
  const parts: string[] = [];

  if (roll?.dice) {
    parts.push(
      `${nameOf(game, roll.player)} gooit ${roll.dice[0]} + ${roll.dice[1]} = ${roll.value}.`,
    );
  }

  for (const event of events) {
    const text = eventText(game, event);
    if (text) {
      parts.push(text);
    }
    if (parts.length >= 3) {
      break;
    }
  }

  return parts.length > 0 ? parts.join(" ") : `${nameOf(game, game.current)} is aan de beurt.`;
}

export function statusHint(game: GanzenbordGame): string {
  if (isFinished(game)) {
    return game.status === "draw" ? "Iedereen zit vast." : "De partij is klaar.";
  }

  const current = game.players.find((player) => player.id === game.current);
  if (!current) {
    return "";
  }

  if (current.controller === "computer") {
    return `${playerName(current)} gooit zo…`;
  }

  return `${playerName(current)} is aan de beurt.`;
}

export function winnerTitle(game: GanzenbordGame): string {
  return game.winner ? `${nameOf(game, game.winner)} wint!` : "Gelijkspel!";
}

export function winnerDescription(game: GanzenbordGame): string {
  return game.winner
    ? `${nameOf(game, game.winner)} bereikte als eerste vakje 63.`
    : "Alle spelers zitten vast; er is geen winnaar.";
}
