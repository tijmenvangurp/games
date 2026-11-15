import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import {
  COMPUTER_LEVELS,
  INITIAL_FEN,
  createDefaultPlayers,
  fenAfterMoves,
  isChessAvatar,
  type ChessMode,
  type ChessMoveRecord,
  type ChessPlayer,
  type ComputerLevel,
} from "@entities/chess";
import { isChessSquare } from "@shared/lib";
import { DEFAULT_HUMAN_COLOR, DEFAULT_LEVEL, DEFAULT_MODE, MAX_NAME_LENGTH } from "./settings";

export const CHESS_STORAGE_KEY = "games.chess.v1";

const MAX_HISTORY = 500;
const PIECES = new Set(["p", "n", "b", "r", "q", "k"]);
const PROMOTION_PIECES = new Set(["n", "b", "r", "q"]);

export interface ChessSettings {
  readonly mode: ChessMode;
  readonly level: ComputerLevel;
  readonly humanColor: Color;
  readonly players: Record<Color, ChessPlayer>;
}

export interface StoredChessState extends ChessSettings {
  readonly phase: "setup" | "playing";
  readonly fen: string;
  readonly history: readonly ChessMoveRecord[];
  readonly resignedBy: Color | null;
}

export function createDefaultState(): StoredChessState {
  return {
    phase: "setup",
    mode: DEFAULT_MODE,
    level: DEFAULT_LEVEL,
    humanColor: DEFAULT_HUMAN_COLOR,
    players: createDefaultPlayers(),
    fen: INITIAL_FEN,
    history: [],
    resignedBy: null,
  };
}

export function loadChessState(): StoredChessState {
  const fallback = createDefaultState();

  try {
    if (typeof localStorage === "undefined") {
      return fallback;
    }

    const raw = localStorage.getItem(CHESS_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return fallback;
    }

    const settings: ChessSettings = {
      mode: isMode(parsed.mode) ? parsed.mode : fallback.mode,
      level: isLevel(parsed.level) ? parsed.level : fallback.level,
      humanColor: isColor(parsed.humanColor) ? parsed.humanColor : fallback.humanColor,
      players: isPlayers(parsed.players) ? parsed.players : fallback.players,
    };
    const game = readGame(parsed);

    if (!game) {
      return { ...settings, phase: "setup", fen: INITIAL_FEN, history: [], resignedBy: null };
    }

    return { ...settings, ...game };
  } catch {
    return fallback;
  }
}

export function saveChessState(state: StoredChessState): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }

    localStorage.setItem(
      CHESS_STORAGE_KEY,
      JSON.stringify({
        phase: state.phase,
        mode: state.mode,
        level: state.level,
        humanColor: state.humanColor,
        players: state.players,
        fen: state.fen,
        history: state.history,
        resignedBy: state.resignedBy,
      }),
    );
  } catch {
    // Opslag is een bonus; zonder localStorage blijft de partij werken.
  }
}

function readGame(
  value: Record<string, unknown>,
): Pick<StoredChessState, "phase" | "fen" | "history" | "resignedBy"> | null {
  if (value.phase !== "playing" && value.phase !== "setup") {
    return null;
  }

  if (typeof value.fen !== "string" || !isValidFen(value.fen)) {
    return null;
  }

  if (!isHistory(value.history)) {
    return null;
  }

  if (!isResignedBy(value.resignedBy)) {
    return null;
  }

  try {
    const replay = fenAfterMoves(value.history.map((move) => move.san));
    if (replay !== value.fen) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    phase: value.phase,
    fen: value.fen,
    history: value.history,
    resignedBy: value.resignedBy ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMode(value: unknown): value is ChessMode {
  return value === "computer" || value === "friend";
}

function isLevel(value: unknown): value is ComputerLevel {
  return typeof value === "string" && (COMPUTER_LEVELS as readonly string[]).includes(value);
}

function isColor(value: unknown): value is Color {
  return value === "w" || value === "b";
}

function isPlayer(value: unknown): value is ChessPlayer {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    value.name.length <= MAX_NAME_LENGTH &&
    isChessAvatar(value.avatar)
  );
}

function isPlayers(value: unknown): value is Record<Color, ChessPlayer> {
  return isRecord(value) && isPlayer(value.w) && isPlayer(value.b);
}

function isPiece(value: unknown): value is PieceSymbol {
  return typeof value === "string" && PIECES.has(value);
}

function isPromotionPiece(value: unknown): value is PieceSymbol {
  return typeof value === "string" && PROMOTION_PIECES.has(value);
}

function isMoveRecord(value: unknown, index: number): value is ChessMoveRecord {
  if (!isRecord(value)) {
    return false;
  }

  if (!isSquare(value.from) || !isSquare(value.to)) {
    return false;
  }

  if (!isSan(value.san)) {
    return false;
  }

  if (value.color !== expectedColor(index)) {
    return false;
  }

  if (!isOptionalPiece(value.captured)) {
    return false;
  }

  return isOptionalPromotion(value.promotion);
}

function isSquare(value: unknown): value is Square {
  return typeof value === "string" && isChessSquare(value);
}

function isSan(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 12;
}

function expectedColor(index: number): Color {
  return index % 2 === 0 ? "w" : "b";
}

function isOptionalPiece(value: unknown): boolean {
  return value === undefined || isPiece(value);
}

function isOptionalPromotion(value: unknown): boolean {
  return value === undefined || isPromotionPiece(value);
}

function isHistory(value: unknown): value is readonly ChessMoveRecord[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_HISTORY &&
    value.every((move, index) => isMoveRecord(move, index))
  );
}

function isResignedBy(value: unknown): value is Color | null | undefined {
  return value === undefined || value === null || isColor(value);
}

function isValidFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}
