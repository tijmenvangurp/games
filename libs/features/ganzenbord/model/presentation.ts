import {
  PLAYER_IDS,
  isFinished,
  type GanzenbordGame,
  type PlayerColor,
  type PlayerId,
  type PlayerState,
  type TurnEvent,
} from "@entities/ganzenbord";
import { getTexts } from "@shared/i18n";
import { ganzenbordTexts } from "./texts";

type NamedPlayer = Pick<PlayerState, "id" | "controller" | "name">;

export function playerNumber(id: PlayerId): number {
  return PLAYER_IDS.indexOf(id) + 1;
}

export function playerName(player: NamedPlayer): string {
  const custom = player.name?.trim();
  if (custom) {
    return custom;
  }
  const t = getTexts(ganzenbordTexts);
  return player.controller === "computer"
    ? t.computer(playerNumber(player.id))
    : t.player(playerNumber(player.id));
}

/** Korte naam voor de spelerskaarten; "Computer 2" wordt daar afgekapt. */
export function playerShortName(player: NamedPlayer): string {
  const custom = player.name?.trim();
  if (custom) {
    return custom;
  }
  const t = getTexts(ganzenbordTexts);
  return player.controller === "computer"
    ? t.cpu(playerNumber(player.id))
    : t.player(playerNumber(player.id));
}

function nameOf(game: GanzenbordGame, id: PlayerId): string {
  const player = game.players.find((candidate) => candidate.id === id);
  return player ? playerName(player) : getTexts(ganzenbordTexts).player(playerNumber(id));
}

const COLOR_CLASSES: Readonly<Record<PlayerColor, string>> = {
  red: "bg-pawn-red",
  orange: "bg-pawn-orange",
  green: "bg-pawn-green",
  blue: "bg-pawn-blue",
  violet: "bg-pawn-violet",
  pink: "bg-pawn-pink",
};

export function playerColorClass(color: PlayerColor): string {
  return COLOR_CLASSES[color];
}

export function positionText(player: PlayerState): string {
  const t = getTexts(ganzenbordTexts).position;
  if (player.position >= 63) {
    return t.finish;
  }
  if (player.stuckOn === 31) {
    return t.well;
  }
  if (player.stuckOn === 52) {
    return t.prison;
  }
  if (player.skipTurns > 0) {
    return t.skip;
  }
  return player.position === 0 ? t.start : t.square(player.position);
}

type SimpleEventKind = "bridge" | "inn" | "well" | "prison" | "maze" | "death";

const SIMPLE_EVENTS: ReadonlySet<TurnEvent["kind"]> = new Set<SimpleEventKind>([
  "bridge",
  "inn",
  "well",
  "prison",
  "maze",
  "death",
]);

function isSimpleEvent(kind: TurnEvent["kind"]): kind is SimpleEventKind {
  return SIMPLE_EVENTS.has(kind);
}

export function eventMessage(game: GanzenbordGame, event: TurnEvent): string | null {
  const t = getTexts(ganzenbordTexts).events;
  if (event.kind === "first-throw") {
    return t.firstThrow(event.to);
  }
  if (event.kind === "bounce") {
    return t.bounce(event.to);
  }
  if (event.kind === "goose") {
    return t.goose(event.to);
  }
  if (event.kind === "free") {
    return t.free(nameOf(game, event.player));
  }
  if (event.kind === "skip") {
    return t.skip(nameOf(game, event.player));
  }
  if (event.kind === "win") {
    return t.win(nameOf(game, event.player));
  }
  if (event.kind === "draw") {
    return t.draw;
  }
  return isSimpleEvent(event.kind) ? t[event.kind] : null;
}

/**
 * Een korte, leesbare samenvatting van de laatste beurt. De volledige
 * gebeurtenissenlijst is te lang voor de statusbalk; de worp en de belangrijkste
 * twee gebeurtenissen zijn genoeg.
 */
export function turnText(game: GanzenbordGame, events: readonly TurnEvent[]): string {
  const t = getTexts(ganzenbordTexts);
  if (game.status === "draw") {
    return t.drawTurn;
  }
  if (game.status === "finished" && game.winner) {
    return t.wins(nameOf(game, game.winner));
  }

  const roll = events.find((event) => event.kind === "roll");
  const parts: string[] = [];

  if (roll?.dice) {
    parts.push(t.rolls(nameOf(game, roll.player), roll.dice[0], roll.dice[1], roll.value));
  }

  for (const event of events) {
    const text = eventMessage(game, event);
    if (text) {
      parts.push(text);
    }
    if (parts.length >= 3) {
      break;
    }
  }

  return parts.length > 0 ? parts.join(" ") : t.turn(nameOf(game, game.current));
}

export function statusHint(game: GanzenbordGame): string {
  const t = getTexts(ganzenbordTexts);
  if (isFinished(game)) {
    return game.status === "draw" ? t.allStuck : t.finished;
  }

  const current = game.players.find((player) => player.id === game.current);
  if (!current) {
    return "";
  }

  if (current.controller === "computer") {
    return t.computerRolls(playerName(current));
  }

  return t.turn(playerName(current));
}

export function winnerTitle(game: GanzenbordGame): string {
  const t = getTexts(ganzenbordTexts);
  return game.winner ? t.wins(nameOf(game, game.winner)) : t.drawTitle;
}

export function winnerDescription(game: GanzenbordGame): string {
  const t = getTexts(ganzenbordTexts);
  return game.winner ? t.winnerDescription(nameOf(game, game.winner)) : t.drawDescription;
}
