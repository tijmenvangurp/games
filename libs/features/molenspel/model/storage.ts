import type { MolenspelGame, MolenspelPlayer } from "@entities/molenspel";

const STORAGE_KEY = "games.molenspel.v1";

interface MolenspelProgress {
  game: MolenspelGame;
  started: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlayer(value: unknown): value is MolenspelPlayer {
  return value === "wit" || value === "zwart";
}

function isPhase(value: unknown): value is MolenspelGame["phase"] {
  return value === "plaatsen" || value === "schuiven" || value === "vliegen";
}

function parsePlayer(value: unknown): MolenspelPlayer | null {
  return isPlayer(value) ? value : null;
}

function parseWinner(value: unknown): MolenspelPlayer | null | undefined {
  if (value === null) {
    return null;
  }
  return isPlayer(value) ? value : undefined;
}

function parseNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function parseBoard(value: unknown): MolenspelGame["board"] | null {
  if (!Array.isArray(value) || value.length !== 24) {
    return null;
  }
  if (value.some((piece) => piece !== null && !isPlayer(piece))) {
    return null;
  }
  return value as MolenspelGame["board"];
}

function parseInHand(value: unknown): MolenspelGame["inHand"] | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.wit !== "number" || typeof value.zwart !== "number") {
    return null;
  }
  return { wit: value.wit, zwart: value.zwart };
}

function parseGame(value: unknown): MolenspelGame | null {
  if (!isRecord(value)) {
    return null;
  }
  const board = parseBoard(value.board);
  const inHand = parseInHand(value.inHand);
  const turn = parsePlayer(value.turn);
  const phase = isPhase(value.phase) ? value.phase : null;
  const winner = parseWinner(value.winner);
  if (!board || !inHand || !turn || !phase || winner === undefined) {
    return null;
  }
  return {
    board,
    inHand,
    turn,
    phase,
    winner,
    selected: typeof value.selected === "number" ? value.selected : null,
    awaitRemoval: value.awaitRemoval === true,
    draw: value.draw === true,
    endgame: value.endgame === true,
    endgameTurns: parseNumber(value.endgameTurns, 0),
    moves: parseNumber(value.moves, 0),
  };
}

export function loadMolenspelProgress(): MolenspelProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    const game = parseGame(parsed.game);
    if (!game) {
      return null;
    }
    return { game, started: parsed.started === true };
  } catch {
    return null;
  }
}

export function saveMolenspelProgress(progress: MolenspelProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Opslag kan niet beschikbaar zijn (privémodus); spelen blijft dan gewoon werken.
  }
}
