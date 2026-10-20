import { useEffect, useId, useMemo, useRef } from "react";
import type { ChessboardOptions } from "react-chessboard";
import { chessBoardOptions, chessSquareStyles, cn, useAutoSpeech } from "@shared/lib";
import {
  Button,
  Check,
  ChessBoard,
  LayoutGrid,
  Lightbulb,
  Play,
  RotateCcw,
  SpeechButton,
} from "@shared/ui";
import { puzzlePromptSpeech, puzzleStatusSpeech, puzzleTitleSpeech } from "../model/audio";
import { useChessPuzzle } from "../model/useChessPuzzle";
import type { ChessPuzzle, PuzzleDifficulty, PuzzleFeedback, PuzzleStatus } from "../model/types";
import { PuzzleDifficultyPicker } from "./PuzzleDifficultyPicker";

interface PuzzlePlayProps {
  readonly difficulty: PuzzleDifficulty;
  readonly puzzle: ChessPuzzle;
  readonly index: number;
  readonly total: number;
  readonly onDifficultyChange: (difficulty: PuzzleDifficulty) => void;
  readonly onNext: () => void;
  readonly onOverview: () => void;
  readonly onSolved?: (puzzle: ChessPuzzle) => void;
}

interface PuzzleHeaderProps {
  readonly index: number;
  readonly prompt: ReturnType<typeof puzzlePromptSpeech>;
  readonly title: ReturnType<typeof puzzleTitleSpeech>;
  readonly titleId: string;
  readonly total: number;
}

function PuzzleHeader({ index, prompt, title, titleId, total }: PuzzleHeaderProps) {
  return (
    <header className="space-y-1 text-center">
      <p className="text-xs font-black uppercase tracking-widest text-primary">
        Puzzel {index + 1} van {total}
      </p>
      <h2 id={titleId} className="text-2xl font-black text-foreground sm:text-3xl">
        {title.text}
      </h2>
      <div className="flex items-center justify-center gap-1">
        <p className="text-sm font-semibold text-muted-foreground">{prompt.text}</p>
        <SpeechButton className="shrink-0" label="Beluister de opdracht" line={prompt} />
      </div>
    </header>
  );
}

function BoardPanel({ options }: { readonly options: ChessboardOptions }) {
  return (
    <ChessBoard
      label="Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Tik op een stuk om te kijken waar het heen kan. Sleep een stuk om te zetten."
      options={options}
    />
  );
}

interface PuzzleStatusProps {
  readonly speech: ReturnType<typeof puzzleStatusSpeech>;
  readonly solved: boolean;
  readonly tone: "success" | "danger" | "primary" | "muted";
}

const TONE_CLASSES: Record<PuzzleStatusProps["tone"], string> = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};

function PuzzleStatusBanner({ speech, solved, tone }: PuzzleStatusProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-2 text-center text-sm font-bold",
        TONE_CLASSES[tone],
      )}
    >
      {solved ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
      <span className="min-w-0">{speech.text}</span>
      <SpeechButton className="shrink-0" label="Beluister de feedback" line={speech} />
    </div>
  );
}

function statusTone(status: PuzzleStatus, feedback: PuzzleFeedback): PuzzleStatusProps["tone"] {
  if (status === "solved") {
    return "success";
  }
  if (feedback === "wrong") {
    return "danger";
  }
  if (feedback === "correct") {
    return "primary";
  }
  return "muted";
}

interface PuzzleActionsProps {
  readonly solved: boolean;
  readonly onHint: () => void;
  readonly onNext: () => void;
  readonly onOverview: () => void;
  readonly onReset: () => void;
}

function PuzzleActions({ solved, onHint, onNext, onOverview, onReset }: PuzzleActionsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Button
          className="min-h-12 px-2 text-xs sm:text-sm"
          disabled={solved}
          variant="outline"
          onClick={onHint}
        >
          <Lightbulb aria-hidden="true" className="size-4 text-warning" />
          Hint
        </Button>
        <Button className="min-h-12 px-2 text-xs sm:text-sm" variant="outline" onClick={onReset}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Opnieuw
        </Button>
        <Button className="min-h-12 px-2 text-xs sm:text-sm" variant="outline" onClick={onOverview}>
          <LayoutGrid aria-hidden="true" className="size-4" />
          Overzicht
        </Button>
      </div>
      <Button className="w-full" disabled={!solved} size="lg" variant="success" onClick={onNext}>
        <Play aria-hidden="true" className="size-5" />
        Volgende puzzel
      </Button>
    </div>
  );
}

export function PuzzlePlay({
  difficulty,
  index,
  puzzle,
  total,
  onDifficultyChange,
  onNext,
  onOverview,
  onSolved,
}: PuzzlePlayProps) {
  const puzzleState = useChessPuzzle(puzzle);
  const titleId = useId();
  const solvedRef = useRef(false);
  const title = puzzleTitleSpeech(puzzle.kind);
  const prompt = puzzlePromptSpeech(puzzle.kind, puzzleState.playerColor);
  const status = puzzleStatusSpeech(
    puzzleState.feedback,
    puzzle.kind,
    puzzleState.status,
    puzzleState.playerColor,
    puzzleState.selectedColor,
  );
  const solved = puzzleState.status === "solved";
  const tone = statusTone(puzzleState.status, puzzleState.feedback);

  useAutoSpeech(`puzzle-prompt-${puzzle.id}`, prompt);
  useAutoSpeech(
    `puzzle-status-${puzzle.id}-${puzzleState.status}-${puzzleState.feedback}-${puzzleState.selectedColor ?? "none"}`,
    status,
  );

  useEffect(() => {
    if (puzzleState.status !== "solved" || solvedRef.current) {
      return;
    }

    solvedRef.current = true;
    onSolved?.(puzzle);
  }, [onSolved, puzzle, puzzleState.status]);

  const squareStyles = useMemo(
    () =>
      chessSquareStyles({
        lastMove: puzzleState.lastMove,
        selectedSquare: puzzleState.selectedSquare,
        legalTargets: puzzleState.legalTargets,
        hintMove: puzzleState.hintMove,
      }),
    [
      puzzleState.lastMove,
      puzzleState.selectedSquare,
      puzzleState.legalTargets,
      puzzleState.hintMove,
    ],
  );

  const boardOptions = chessBoardOptions({
    position: puzzleState.fen,
    playerColor: puzzleState.playerColor,
    allowDragging: puzzleState.status === "playing",
    squareStyles,
    onPieceDrop: puzzleState.onPieceDrop,
    onSquareClick: puzzleState.onSquareClick,
  });

  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <PuzzleHeader index={index} prompt={prompt} title={title} titleId={titleId} total={total} />
      <PuzzleDifficultyPicker current={difficulty} onSelect={onDifficultyChange} />
      <BoardPanel options={boardOptions} />
      <PuzzleStatusBanner speech={status} solved={solved} tone={tone} />
      <PuzzleActions
        solved={puzzleState.status === "solved"}
        onHint={puzzleState.showHint}
        onNext={onNext}
        onOverview={onOverview}
        onReset={puzzleState.resetPuzzle}
      />
    </section>
  );
}
