import { FINISH } from "./board";
import { movePlayer } from "./movement";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_IDS,
  type Dice,
  type GanzenbordGame,
  type PlayerId,
  type PlayerSetup,
  type PlayerState,
  type TurnEvent,
  type TurnResult,
} from "./types";

function updatePlayer(
  players: readonly PlayerState[],
  id: PlayerId,
  patch: Partial<PlayerState>,
): readonly PlayerState[] {
  return players.map((player) => (player.id === id ? { ...player, ...patch } : player));
}

function assertDice(dice: Dice): void {
  for (const value of dice) {
    if (!Number.isInteger(value) || value < 1 || value > 6) {
      throw new Error(`Ongeldige dobbelsteenwaarde: ${value}`);
    }
  }
}

/**
 * Maakt een partij. De spelers houden de vaste volgorde een, twee, drie, vier;
 * de UI mag ze dus niet door elkaar husselen. De startspeler is standaard de
 * eerste speler.
 */
export function createGame(setups: readonly PlayerSetup[], first?: PlayerId): GanzenbordGame {
  if (setups.length < MIN_PLAYERS || setups.length > MAX_PLAYERS) {
    throw new Error(`Ganzenbord heeft ${MIN_PLAYERS} tot ${MAX_PLAYERS} spelers nodig`);
  }

  const ids = new Set<PlayerId>();
  for (const setup of setups) {
    if (!PLAYER_IDS.includes(setup.id)) {
      throw new Error(`Onbekende speler: ${setup.id}`);
    }
    if (ids.has(setup.id)) {
      throw new Error(`Dubbele speler: ${setup.id}`);
    }
    ids.add(setup.id);
  }

  const ordered = PLAYER_IDS.filter((id) => ids.has(id));
  const controllers = new Map(setups.map((setup) => [setup.id, setup.controller]));
  const players: PlayerState[] = ordered.map((id) => ({
    id,
    controller: controllers.get(id) ?? "human",
    position: 0,
    skipTurns: 0,
    stuckOn: null,
    firstRollDone: false,
  }));

  const startingPlayer = first && ids.has(first) ? first : players[0].id;

  return {
    players,
    current: startingPlayer,
    first: startingPlayer,
    status: "playing",
    winner: null,
    lastRoll: null,
  };
}

export function isFinished(game: GanzenbordGame): boolean {
  return game.status !== "playing";
}

interface AdvanceResult {
  readonly players: readonly PlayerState[];
  readonly current: PlayerId;
  readonly draw: boolean;
}

/**
 * Zoekt de volgende speler die echt mag gooien. Een speler in de put of
 * gevangenis wordt overgeslagen; een speler met een skipbeurt verliest die
 * beurt en is daarna weer aan de beurt.
 */
function advanceTurn(
  players: readonly PlayerState[],
  fromIndex: number,
  events: TurnEvent[],
): AdvanceResult {
  let nextPlayers = players;
  let index = fromIndex;

  for (let guard = 0; guard < players.length * 8 + 8; guard += 1) {
    index = (index + 1) % players.length;
    const candidate = nextPlayers[index];

    if (candidate.position === FINISH) {
      continue;
    }
    if (candidate.stuckOn !== null) {
      continue;
    }
    if (candidate.skipTurns > 0) {
      nextPlayers = updatePlayer(nextPlayers, candidate.id, {
        skipTurns: candidate.skipTurns - 1,
      });
      events.push({ kind: "skip", player: candidate.id, value: candidate.skipTurns });
      continue;
    }

    return { players: nextPlayers, current: candidate.id, draw: false };
  }

  events.push({ kind: "draw", player: players[fromIndex].id });
  return { players: nextPlayers, current: players[fromIndex].id, draw: true };
}

interface SpecialResult {
  readonly players: readonly PlayerState[];
  readonly position: number;
  readonly status: "playing" | "finished" | "draw";
  readonly winner: PlayerId | null;
}

function moveEvents(
  player: PlayerId,
  steps: readonly { kind: string; from: number; to: number }[],
): TurnEvent[] {
  return steps.map((step) => {
    if (step.kind === "roll") {
      return { kind: "move", player, from: step.from, to: step.to } as const;
    }
    if (step.kind === "bounce") {
      return { kind: "bounce", player, from: step.from, to: step.to } as const;
    }
    if (step.kind === "goose") {
      return { kind: "goose", player, from: step.from, to: step.to } as const;
    }
    return { kind: "first-throw", player, from: step.from, to: step.to } as const;
  });
}

function stickPlayer(
  players: readonly PlayerState[],
  player: PlayerId,
  square: 31 | 52,
  events: TurnEvent[],
): readonly PlayerState[] {
  const stuck = players.find(
    (candidate) => candidate.id !== player && candidate.stuckOn === square,
  );
  let next = players;
  if (stuck) {
    next = updatePlayer(next, stuck.id, { stuckOn: null });
    events.push({ kind: "free", player: stuck.id, other: player, value: square });
  }
  next = updatePlayer(next, player, { stuckOn: square });
  events.push({
    kind: square === 31 ? "well" : "prison",
    player,
    from: square,
    to: square,
  });
  return next;
}

/**
 * Verwerkt het vakje waar de speler na de worp op staat. De functie is
 * gescheiden van de worp zelf, zodat de beurtlus kort en testbaar blijft.
 */
function resolveSpecial(
  players: readonly PlayerState[],
  player: PlayerId,
  position: number,
  events: TurnEvent[],
): SpecialResult {
  switch (position) {
    case 6: {
      events.push({ kind: "bridge", player, from: 6, to: 12 });
      return {
        players: updatePlayer(players, player, { position: 12 }),
        position: 12,
        status: "playing",
        winner: null,
      };
    }
    case 19: {
      events.push({ kind: "inn", player, from: 19, to: 19, value: 1 });
      return {
        players: updatePlayer(players, player, { skipTurns: 1 }),
        position,
        status: "playing",
        winner: null,
      };
    }
    case 31:
    case 52: {
      return {
        players: stickPlayer(players, player, position, events),
        position,
        status: "playing",
        winner: null,
      };
    }
    case 42: {
      events.push({ kind: "maze", player, from: 42, to: 37 });
      return {
        players: updatePlayer(players, player, { position: 37 }),
        position: 37,
        status: "playing",
        winner: null,
      };
    }
    case 58: {
      events.push({ kind: "death", player, from: 58, to: 0 });
      return {
        players: updatePlayer(players, player, { position: 0 }),
        position: 0,
        status: "playing",
        winner: null,
      };
    }
    case FINISH: {
      events.push({ kind: "win", player, from: 63, to: 63 });
      return {
        players: updatePlayer(players, player, { position: FINISH, stuckOn: null }),
        position,
        status: "finished",
        winner: player,
      };
    }
    default:
      return { players, position, status: "playing", winner: null };
  }
}

/**
 * Speelt één beurt met de gegeven dobbelstenen. De functie is puur: dezelfde
 * toestand en dezelfde worp geven altijd hetzelfde resultaat. De store of de
 * tests bepalen de worp, zodat het spel deterministisch te testen is.
 */
export function playTurn(game: GanzenbordGame, dice: Dice): TurnResult {
  if (game.status !== "playing") {
    throw new Error("De partij is al afgelopen");
  }
  assertDice(dice);

  const index = game.players.findIndex((player) => player.id === game.current);
  if (index < 0) {
    throw new Error(`Speler ${game.current} ontbreekt`);
  }

  const player = game.players[index];
  if (player.stuckOn !== null || player.skipTurns > 0) {
    throw new Error(`Speler ${player.id} mag nu niet gooien`);
  }

  const total = dice[0] + dice[1];
  const move = movePlayer(player.position, dice, !player.firstRollDone);
  const events: TurnEvent[] = [
    { kind: "roll", player: player.id, value: total, dice },
    ...moveEvents(player.id, move.steps),
  ];

  const movedPlayers = updatePlayer(game.players, player.id, {
    position: move.position,
    firstRollDone: true,
  });
  const special = resolveSpecial(movedPlayers, player.id, move.position, events);

  let players = special.players;
  let status = special.status;
  let current = game.current;

  if (status === "playing") {
    const advanced = advanceTurn(players, index, events);
    players = advanced.players;
    if (advanced.draw) {
      status = "draw";
    } else {
      current = advanced.current;
    }
  }

  return {
    game: {
      ...game,
      players,
      current,
      status,
      winner: special.winner,
      lastRoll: { player: player.id, dice, total },
    },
    events,
  };
}
