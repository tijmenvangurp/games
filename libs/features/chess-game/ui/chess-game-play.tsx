import { useMemo } from "react";
import type { Color } from "chess.js";
import type { ChessboardOptions } from "react-chessboard";
import { Chessboard } from "react-chessboard";
import {
  checkedKingSquare,
  otherColor,
  turnOf,
  type ChessMode,
  type ChessResult,
} from "@entities/chess";
import { chessBoardOptions, chessSquareStyles, cn } from "@shared/lib";
import { Button, CelebrationDialog, Flag, LayoutGrid, Lightbulb, Undo2 } from "@shared/ui";
import {
  capturedBy,
  feedbackText,
  resultCopy,
  statusText,
  SIDE_LABEL,
} from "../model/presentation";
import { resultOf, useChessGameStore, type ChessStore } from "../model/use-chess-game-store";
import { MoveList } from "./move-list";
import { PlayerCard } from "./player-card";
import { PromotionPicker } from "./promotion-picker";

interface ChessGamePlayProps {
  readonly onHome: () => void;
}

function hintLabelFor(state: Pick<ChessStore, "hint" | "hintTarget" | "hintThinking">): string {
  if (state.hintThinking) {
    return "Hint…";
  }

  if (!state.hint) {
    return "Hint";
  }

  return state.hintTarget ? "Wis hint" : "Toon zet";
}

function canHumanPlay(state: ChessStore, result: ChessResult, turn: Color): boolean {
  if (result.kind !== "playing" || state.thinking) {
    return false;
  }

  return state.mode === "friend" || turn === state.humanColor;
}

function PlayerCards({
  state,
  activeColor,
}: {
  readonly state: ChessStore;
  readonly activeColor: Color | null;
}) {
  return (
    <div className="flex items-stretch gap-2">
      {(["w", "b"] as const).map((color) => (
        <PlayerCard
          key={color}
          active={activeColor === color}
          captured={capturedBy(state.history, color)}
          color={color}
          player={state.players[color]}
          thinking={state.thinking && activeColor === color}
        />
      ))}
    </div>
  );
}

function statusClassName(feedback: string | null, result: ChessResult): string {
  if (feedback) {
    return "bg-amber-100 text-amber-950";
  }

  if (result.kind !== "playing") {
    return "bg-emerald-100 text-emerald-950";
  }

  return result.check ? "bg-rose-100 text-rose-950" : "bg-sky-50 text-sky-950";
}

interface StatusPanelProps {
  readonly feedback: string | null;
  readonly status: string;
  readonly result: ChessResult;
  readonly mode: ChessMode;
  readonly humanColor: Color;
}

function StatusPanel({ feedback, status, result, mode, humanColor }: StatusPanelProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={cn("rounded-2xl px-4 py-3", statusClassName(feedback, result))}
    >
      <p className="text-base font-black leading-snug sm:text-lg">{feedback ?? status}</p>
      <p className="mt-0.5 text-xs font-semibold opacity-80">
        {mode === "computer"
          ? `Jij speelt met ${SIDE_LABEL[humanColor].toLowerCase()} · de computer met ${SIDE_LABEL[otherColor(humanColor)].toLowerCase()}.`
          : "Jullie spelen om de beurt op dit scherm."}
      </p>
    </div>
  );
}

interface BoardPanelProps {
  readonly position: string;
  readonly playerColor: Color;
  readonly dragColor: Color;
  readonly allowDragging: boolean;
  readonly squareStyles: ReturnType<typeof chessSquareStyles>;
  readonly onMove: (from: string, to: string) => boolean;
  readonly onSelect: (square: string) => void;
}

function BoardPanel({
  position,
  playerColor,
  dragColor,
  allowDragging,
  squareStyles,
  onMove,
  onSelect,
}: BoardPanelProps) {
  const boardOptions: ChessboardOptions = chessBoardOptions({
    position,
    playerColor,
    dragColor,
    allowDragging,
    squareStyles,
    onPieceDrop: (sourceSquare, targetSquare) =>
      targetSquare !== null && onMove(sourceSquare, targetSquare),
    onSquareClick: onSelect,
  });

  return (
    <div
      aria-label="Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Tik op een stuk en daarna op een groene stip, of sleep het stuk."
      className="mx-auto w-full max-w-lg"
      role="group"
    >
      <div className="aspect-square w-full touch-manipulation">
        <Chessboard options={boardOptions} />
      </div>
    </div>
  );
}

interface GameActionsProps {
  readonly canHint: boolean;
  readonly hintActive: boolean;
  readonly hintLabel: string;
  readonly canUndo: boolean;
  readonly finished: boolean;
  readonly thinking: boolean;
  readonly onHint: () => void;
  readonly onUndo: () => void;
  readonly onResign: () => void;
  readonly onSetup: () => void;
}

function GameActions({
  canHint,
  hintActive,
  hintLabel,
  canUndo,
  finished,
  thinking,
  onHint,
  onUndo,
  onResign,
  onSetup,
}: GameActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        className="min-h-12 px-2 text-xs sm:text-sm"
        disabled={!canHint}
        variant={hintActive ? "default" : "outline"}
        onClick={onHint}
      >
        <Lightbulb aria-hidden="true" className="size-5" />
        {hintLabel}
      </Button>
      <Button
        className="min-h-12 px-2 text-xs sm:text-sm"
        disabled={!canUndo}
        variant="outline"
        onClick={onUndo}
      >
        <Undo2 aria-hidden="true" className="size-5" />
        Ongedaan
      </Button>
      <Button
        className="min-h-12 px-2 text-xs sm:text-sm"
        disabled={finished || thinking}
        variant="outline"
        onClick={onResign}
      >
        <Flag aria-hidden="true" className="size-5" />
        Opgeven
      </Button>
      <Button className="min-h-12 px-2 text-xs sm:text-sm" variant="outline" onClick={onSetup}>
        <LayoutGrid aria-hidden="true" className="size-5" />
        Instellingen
      </Button>
    </div>
  );
}

export function ChessGamePlay({ onHome }: ChessGamePlayProps) {
  const state = useChessGameStore();
  const result = resultOf(state);
  const turn = turnOf(state.fen);
  const activeColor = result.kind === "playing" ? turn : null;
  const checkSquare = checkedKingSquare(state.fen);
  const boardColor = state.mode === "computer" ? state.humanColor : "w";
  const dragColor = state.mode === "computer" ? state.humanColor : turn;
  const canPlay = canHumanPlay(state, result, turn);
  const status = statusText({
    result,
    turn,
    players: state.players,
    thinking: state.thinking,
  });
  const feedback = feedbackText(state.feedback);
  const copy = resultCopy(result, state.players, state.mode, state.humanColor);
  const hintLabel = hintLabelFor(state);

  const squareStyles = useMemo(
    () =>
      chessSquareStyles({
        lastMove: state.lastMove,
        selectedSquare: state.selectedSquare,
        legalTargets: state.legalTargets,
        hintSquare: state.hint && !state.hintTarget ? state.hint.from : null,
        hintMove: state.hint && state.hintTarget ? state.hint : null,
        checkSquare,
      }),
    [
      state.lastMove,
      state.selectedSquare,
      state.legalTargets,
      state.hint,
      state.hintTarget,
      checkSquare,
    ],
  );

  return (
    <section aria-label="Schaakpartij" className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PlayerCards activeColor={activeColor} state={state} />
      <StatusPanel
        feedback={feedback}
        humanColor={state.humanColor}
        mode={state.mode}
        result={result}
        status={status}
      />
      <BoardPanel
        allowDragging={canPlay}
        dragColor={dragColor}
        playerColor={boardColor}
        position={state.fen}
        squareStyles={squareStyles}
        onMove={state.attemptMove}
        onSelect={state.selectSquare}
      />
      <GameActions
        canHint={canPlay && !state.hintThinking}
        canUndo={state.canUndo()}
        finished={result.kind !== "playing"}
        hintActive={state.hint !== null}
        hintLabel={hintLabel}
        thinking={state.thinking}
        onHint={state.requestHint}
        onResign={state.resign}
        onSetup={state.resetToSetup}
        onUndo={state.undo}
      />
      <MoveList history={state.history} />

      {state.pendingPromotion ? (
        <PromotionPicker onCancel={state.cancelPromotion} onChoose={state.choosePromotion} />
      ) : null}

      {result.kind !== "playing" ? (
        <CelebrationDialog
          chooseLabel="Nieuwe tegenstander"
          confetti={copy.confetti}
          description={copy.description}
          title={copy.title}
          onAgain={state.startGame}
          onChoose={state.resetToSetup}
          onHome={onHome}
        />
      ) : null}
    </section>
  );
}
