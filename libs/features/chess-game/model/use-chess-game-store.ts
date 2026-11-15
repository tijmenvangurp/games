import type { Color, PieceSymbol, Square } from "chess.js";
import { create } from "zustand";
import {
  INITIAL_FEN,
  describeResult,
  fenAfterMoves,
  isChessAvatar,
  legalMoves,
  otherColor,
  playMove,
  turnOf,
  type ChessMode,
  type ChessMoveRecord,
  type ChessMoveResult,
  type ChessPlayer,
  type ChessResult,
  type ComputerLevel,
} from "@entities/chess";
import { isChessSquare, playHaptic, playSound } from "@shared/lib";
import type { EngineMove } from "./engine";
import { requestEngineMove } from "./engine-request";
import { resolveSquareClick, selectionForAction } from "./selection";
import { loadChessState, saveChessState, type StoredChessState } from "./storage";
import { MAX_NAME_LENGTH } from "./settings";

export type ChessFeedback = "idle" | "illegal" | "not-your-turn" | "engine-error";

export interface BoardMove {
  readonly from: Square;
  readonly to: Square;
}

export interface ChessStore extends StoredChessState {
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly lastMove: BoardMove | null;
  readonly pendingPromotion: BoardMove | null;
  readonly thinking: boolean;
  readonly hint: BoardMove | null;
  readonly hintTarget: boolean;
  readonly hintThinking: boolean;
  readonly feedback: ChessFeedback;
  readonly gameId: number;
  readonly setMode: (mode: ChessMode) => void;
  readonly setLevel: (level: ComputerLevel) => void;
  readonly setHumanColor: (color: Color) => void;
  readonly setPlayerName: (color: Color, name: string) => void;
  readonly setPlayerAvatar: (color: Color, avatar: string) => void;
  readonly startGame: () => void;
  readonly resetToSetup: () => void;
  readonly canResume: () => boolean;
  readonly resumeGame: () => void;
  readonly selectSquare: (square: string) => void;
  readonly attemptMove: (from: string, to: string, promotion?: PieceSymbol) => boolean;
  readonly choosePromotion: (piece: PieceSymbol) => void;
  readonly cancelPromotion: () => void;
  readonly undo: () => void;
  readonly canUndo: () => boolean;
  readonly resign: () => void;
  readonly requestHint: () => void;
  readonly resumeEngine: () => void;
  readonly suspendEngine: () => void;
}

type StoreSet = (
  partial: Partial<ChessStore> | ((state: ChessStore) => Partial<ChessStore>),
) => void;
type StoreGet = () => ChessStore;

export function resultOf(state: Pick<ChessStore, "fen" | "resignedBy">): ChessResult {
  return state.resignedBy
    ? { kind: "resigned", winner: otherColor(state.resignedBy) }
    : describeResult(state.fen);
}

function canResumeState(
  state: Pick<ChessStore, "phase" | "fen" | "history" | "resignedBy">,
): boolean {
  return state.phase === "setup" && state.history.length > 0 && resultOf(state).kind === "playing";
}

const COMPUTER_NAME = "Computer";
const DEFAULT_NAMES: Record<Color, string> = { w: "Wit", b: "Zwart" };
const HINT_LEVEL: ComputerLevel = "moeilijk";

function snapshot(state: ChessStore): StoredChessState {
  return {
    phase: state.phase,
    mode: state.mode,
    level: state.level,
    humanColor: state.humanColor,
    players: state.players,
    fen: state.fen,
    history: state.history,
    resignedBy: state.resignedBy,
  };
}

function commit(set: StoreSet, get: StoreGet, partial: Partial<ChessStore>): void {
  set(partial);
  saveChessState(snapshot(get()));
}

function canMove(state: ChessStore): boolean {
  if (state.phase !== "playing" || state.thinking) {
    return false;
  }

  if (resultOf(state).kind !== "playing") {
    return false;
  }

  return state.mode === "friend" || turnOf(state.fen) === state.humanColor;
}

function humanName(player: ChessPlayer, color: Color): string {
  const name = player.name.trim();

  if (name === "" || name === COMPUTER_NAME) {
    return DEFAULT_NAMES[color];
  }

  return name;
}

function startPlayers(state: StoredChessState): Record<Color, ChessPlayer> {
  if (state.mode !== "computer") {
    return state.players;
  }

  const computerColor = otherColor(state.humanColor);
  const human = state.players[state.humanColor];
  const computer = state.players[computerColor];

  return {
    ...state.players,
    [state.humanColor]: { ...human, name: humanName(human, state.humanColor) },
    [computerColor]: { ...computer, name: COMPUTER_NAME },
  };
}

function shouldEngineMove(state: ChessStore): boolean {
  return (
    state.phase === "playing" &&
    state.mode === "computer" &&
    !state.thinking &&
    state.resignedBy === null &&
    resultOf(state).kind === "playing" &&
    turnOf(state.fen) !== state.humanColor
  );
}

function soundForResult(state: ChessStore, result: ChessResult): "win" | "almost" {
  const playerWon =
    (result.kind === "checkmate" || result.kind === "resigned") &&
    result.winner === state.humanColor;

  return state.mode === "friend" || playerWon ? "win" : "almost";
}

function commitMove(
  set: StoreSet,
  get: StoreGet,
  attempt: Extract<ChessMoveResult, { ok: true }>,
  fromEngine = false,
): void {
  const state = get();
  commit(set, get, {
    fen: attempt.fen,
    history: [...state.history, attempt.move],
    lastMove: { from: attempt.move.from, to: attempt.move.to },
    selectedSquare: null,
    legalTargets: [],
    pendingPromotion: null,
    thinking: false,
    hint: null,
    hintTarget: false,
    hintThinking: false,
    feedback: "idle",
  });

  if (attempt.result.kind === "playing") {
    playSound("select");
    playHaptic("select");
  } else {
    const sound = soundForResult(state, attempt.result);
    playSound(sound);
    playHaptic(sound === "win" ? "win" : "almost");
  }

  if (!fromEngine) {
    void runEngine(set, get);
  }
}

function applyEngineMove(
  set: StoreSet,
  get: StoreGet,
  state: ChessStore,
  move: EngineMove,
): boolean {
  const attempt = playMove(state.fen, move.from, move.to, move.promotion);

  if (attempt.ok) {
    commitMove(set, get, attempt, true);
    return true;
  }

  if (attempt.reason !== "promotion-required") {
    return false;
  }

  const withQueen = playMove(state.fen, move.from, move.to, "q");

  if (!withQueen.ok) {
    return false;
  }

  commitMove(set, get, withQueen, true);
  return true;
}

async function runEngine(set: StoreSet, get: StoreGet): Promise<void> {
  const state = get();

  if (!shouldEngineMove(state)) {
    return;
  }

  const token = state.gameId;
  const fen = state.fen;
  const level = state.level;
  commit(set, get, { thinking: true });

  let move: EngineMove | null = null;
  try {
    move = await requestEngineMove(fen, level);
  } catch {
    move = null;
  }

  const current = get();
  if (current.gameId !== token || !current.thinking || current.phase !== "playing") {
    return;
  }

  commit(set, get, { thinking: false });

  if (!move || !applyEngineMove(set, get, current, move)) {
    commit(set, get, { feedback: "engine-error" });
  }
}

async function runHint(set: StoreSet, get: StoreGet): Promise<void> {
  const state = get();

  if (!canMove(state) || state.hintThinking) {
    return;
  }

  if (state.hint) {
    const hintTarget = !state.hintTarget;
    commit(set, get, { hint: hintTarget ? state.hint : null, hintTarget });
    playHaptic("tap");
    return;
  }

  const token = state.gameId;
  const fen = state.fen;
  commit(set, get, { hintThinking: true });

  let move: EngineMove | null = null;
  try {
    move = await requestEngineMove(fen, HINT_LEVEL);
  } catch {
    move = null;
  }

  const current = get();
  if (current.gameId !== token || current.fen !== fen || current.phase !== "playing") {
    return;
  }

  commit(set, get, {
    hintThinking: false,
    hint: move ? { from: move.from, to: move.to } : null,
    hintTarget: false,
    feedback: move ? current.feedback : "engine-error",
  });

  if (move) {
    playHaptic("tap");
  }
}

function undoableCount(state: ChessStore): number {
  if (state.phase !== "playing" || state.thinking || state.history.length === 0) {
    return 0;
  }

  for (let remove = 1; remove <= state.history.length; remove += 1) {
    try {
      const fen = fenAfterMoves(
        state.history.slice(0, state.history.length - remove).map((m) => m.san),
      );
      if (state.mode === "friend" || turnOf(fen) === state.humanColor) {
        return remove;
      }
    } catch {
      return 0;
    }
  }

  return 0;
}

const initial = loadChessState();
const initialLast = initial.history.at(-1);
const initialLastMove: BoardMove | null = initialLast
  ? { from: initialLast.from, to: initialLast.to }
  : null;

export const useChessGameStore = create<ChessStore>((set, get) => ({
  ...initial,
  selectedSquare: null,
  legalTargets: [],
  lastMove: initialLastMove,
  pendingPromotion: null,
  thinking: false,
  hint: null,
  hintTarget: false,
  hintThinking: false,
  feedback: "idle",
  gameId: 0,

  setMode: (mode) => {
    commit(set, get, { mode });
  },

  setLevel: (level) => {
    commit(set, get, { level });
  },

  setHumanColor: (humanColor) => {
    commit(set, get, { humanColor });
  },

  setPlayerName: (color, name) => {
    const players: Record<Color, ChessPlayer> = {
      ...get().players,
      [color]: { ...get().players[color], name: name.slice(0, MAX_NAME_LENGTH) },
    };
    commit(set, get, { players });
  },

  setPlayerAvatar: (color, avatar) => {
    if (!isChessAvatar(avatar)) {
      return;
    }

    const players: Record<Color, ChessPlayer> = {
      ...get().players,
      [color]: { ...get().players[color], avatar },
    };
    commit(set, get, { players });
  },

  startGame: () => {
    const state = get();

    commit(set, get, {
      phase: "playing",
      players: startPlayers(state),
      fen: INITIAL_FEN,
      history: [],
      resignedBy: null,
      selectedSquare: null,
      legalTargets: [],
      lastMove: null,
      pendingPromotion: null,
      thinking: false,
      hint: null,
      hintTarget: false,
      hintThinking: false,
      feedback: "idle",
      gameId: state.gameId + 1,
    });

    playSound("tap");
    playHaptic("tap");
    void runEngine(set, get);
  },

  resetToSetup: () => {
    const state = get();
    const resumable = state.history.length > 0 && resultOf(state).kind === "playing";
    const fen = resumable ? state.fen : INITIAL_FEN;
    const history = resumable ? state.history : [];
    const resignedBy = resumable ? state.resignedBy : null;
    const lastMove = resumable ? state.lastMove : null;

    commit(set, get, {
      phase: "setup",
      fen,
      history,
      resignedBy,
      selectedSquare: null,
      legalTargets: [],
      lastMove,
      pendingPromotion: null,
      thinking: false,
      hint: null,
      hintTarget: false,
      hintThinking: false,
      feedback: "idle",
      gameId: state.gameId + 1,
    });
  },

  canResume: () => canResumeState(get()),

  resumeGame: () => {
    const state = get();
    if (!canResumeState(state)) {
      return;
    }

    commit(set, get, {
      phase: "playing",
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      thinking: false,
      hint: null,
      hintTarget: false,
      hintThinking: false,
      feedback: "idle",
      gameId: state.gameId + 1,
    });

    playSound("tap");
    playHaptic("tap");
    void runEngine(set, get);
  },

  selectSquare: (square) => {
    const state = get();
    if (!canMove(state)) {
      return;
    }

    const action = resolveSquareClick(
      { selectedSquare: state.selectedSquare, legalTargets: state.legalTargets },
      square,
      (candidate) => legalMoves(state.fen, candidate),
    );

    if (action.kind === "attempt") {
      get().attemptMove(action.from, action.to);
      return;
    }

    commit(set, get, { ...selectionForAction(action), feedback: "idle" });
  },

  attemptMove: (from, to, promotion) => {
    const state = get();
    if (!canMove(state)) {
      return false;
    }

    const attempt = playMove(state.fen, from, to, promotion);

    if (!attempt.ok) {
      if (attempt.reason === "promotion-required" && isChessSquare(from) && isChessSquare(to)) {
        commit(set, get, {
          pendingPromotion: { from, to },
          selectedSquare: null,
          legalTargets: [],
          feedback: "idle",
        });
        playHaptic("tap");
        return false;
      }

      commit(set, get, {
        selectedSquare: null,
        legalTargets: [],
        feedback: attempt.reason === "wrong-color" ? "not-your-turn" : "illegal",
      });
      return false;
    }

    commitMove(set, get, attempt);
    return true;
  },

  choosePromotion: (piece) => {
    const pending = get().pendingPromotion;
    if (!pending) {
      return;
    }

    commit(set, get, { pendingPromotion: null });
    get().attemptMove(pending.from, pending.to, piece);
  },

  cancelPromotion: () => {
    commit(set, get, { pendingPromotion: null, feedback: "idle" });
  },

  undo: () => {
    const state = get();
    const remove = undoableCount(state);
    if (remove === 0) {
      return;
    }

    const history = state.history.slice(0, state.history.length - remove);
    const fen = fenAfterMoves(history.map((move) => move.san));
    const last = history.at(-1);
    const lastMove: BoardMove | null = last ? { from: last.from, to: last.to } : null;

    commit(set, get, {
      fen,
      history,
      resignedBy: null,
      lastMove,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      thinking: false,
      hint: null,
      hintTarget: false,
      hintThinking: false,
      feedback: "idle",
      gameId: state.gameId + 1,
    });
    playSound("tap");
    playHaptic("tap");
  },

  canUndo: () => undoableCount(get()) > 0,

  resign: () => {
    const state = get();
    if (state.phase !== "playing" || resultOf(state).kind !== "playing") {
      return;
    }

    const resignedBy = state.mode === "computer" ? state.humanColor : turnOf(state.fen);
    commit(set, get, {
      resignedBy,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      thinking: false,
      hint: null,
      hintTarget: false,
      hintThinking: false,
      gameId: state.gameId + 1,
    });
    playSound("almost");
    playHaptic("almost");
  },

  requestHint: () => {
    void runHint(set, get);
  },

  resumeEngine: () => {
    void runEngine(set, get);
  },

  suspendEngine: () => {
    const state = get();
    if (!state.thinking) {
      return;
    }

    commit(set, get, {
      thinking: false,
      feedback: "idle",
      gameId: state.gameId + 1,
    });
  },
}));
