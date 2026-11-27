import { useEffect, useId, useMemo, useRef } from "react";
import type { ChessboardOptions } from "react-chessboard";
import { useTexts } from "@shared/i18n";
import type { SpeechLine } from "@shared/lib";
import { chessBoardOptions, chessSquareStyles, useAutoSpeech } from "@shared/lib";
import {
  Button,
  Check,
  ChessBoard,
  LayoutGrid,
  Lightbulb,
  Play,
  RotateCcw,
  SpeechButton,
  StatusBanner,
  type StatusTone,
} from "@shared/ui";
import {
  PUZZLE_STATUS_LINES,
  puzzlePromptSpeech,
  puzzleStatusKey,
  type PuzzleStatusKey,
} from "../model/audio";
import { useChessPuzzle } from "../model/useChessPuzzle";
import type {
  ChessPuzzle,
  PuzzleDifficulty,
  PuzzleFeedback,
  PuzzleKind,
  PuzzleStatus,
} from "../model/types";
import { PuzzleDifficultyPicker } from "./PuzzleDifficultyPicker";
import { puzzleTexts } from "./texts";

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
  readonly kind: PuzzleKind;
  readonly playerColor: "w" | "b";
  readonly titleId: string;
  readonly total: number;
}

function PuzzleHeader({ index, kind, playerColor, titleId, total }: PuzzleHeaderProps) {
  const t = useTexts(puzzleTexts);
  const prompt = puzzlePromptSpeech(kind, playerColor);

  return (
    <header className="space-y-1 text-center">
      <p className="text-xs font-semibold tabular-nums text-muted-foreground">
        {t.puzzleOf(index + 1, total)}
      </p>
      <h2 id={titleId} className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
        {t.titles[kind]}
      </h2>
      <div className="flex items-center justify-center gap-1">
        <p className="text-sm font-semibold text-muted-foreground">
          {t.prompts[kind][playerColor]}
        </p>
        <SpeechButton className="shrink-0" label={t.listenPrompt} line={prompt} />
      </div>
    </header>
  );
}

function BoardPanel({ options }: { readonly options: ChessboardOptions }) {
  const t = useTexts(puzzleTexts);

  return <ChessBoard label={t.board} options={options} />;
}

interface PuzzleStatusProps {
  readonly statusKey: PuzzleStatusKey;
  readonly speech: SpeechLine;
  readonly solved: boolean;
  readonly tone: StatusTone;
}

function PuzzleStatusBanner({ statusKey, speech, solved, tone }: PuzzleStatusProps) {
  const t = useTexts(puzzleTexts);

  return (
    <StatusBanner
      action={<SpeechButton label={t.listenFeedback} line={speech} />}
      align="center"
      className="text-sm"
      icon={solved ? <Check className="size-5" /> : undefined}
      tone={tone}
    >
      {t.status[statusKey]}
    </StatusBanner>
  );
}

function statusTone(status: PuzzleStatus, feedback: PuzzleFeedback): StatusTone {
  if (status === "solved") {
    return "success";
  }
  if (feedback === "wrong") {
    return "danger";
  }
  if (feedback === "correct") {
    return "primary";
  }
  return "neutral";
}

interface PuzzleActionsProps {
  readonly solved: boolean;
  readonly onHint: () => void;
  readonly onNext: () => void;
  readonly onOverview: () => void;
  readonly onReset: () => void;
}

function PuzzleActions({ solved, onHint, onNext, onOverview, onReset }: PuzzleActionsProps) {
  const t = useTexts(puzzleTexts);

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
          {t.hint}
        </Button>
        <Button className="min-h-12 px-2 text-xs sm:text-sm" variant="outline" onClick={onReset}>
          <RotateCcw aria-hidden="true" className="size-4" />
          {t.reset}
        </Button>
        <Button className="min-h-12 px-2 text-xs sm:text-sm" variant="outline" onClick={onOverview}>
          <LayoutGrid aria-hidden="true" className="size-4" />
          {t.overview}
        </Button>
      </div>
      <Button className="w-full" disabled={!solved} size="lg" variant="success" onClick={onNext}>
        <Play aria-hidden="true" className="size-5" />
        {t.nextPuzzle}
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
  const prompt = puzzlePromptSpeech(puzzle.kind, puzzleState.playerColor);
  const statusKey = puzzleStatusKey(
    puzzleState.feedback,
    puzzle.kind,
    puzzleState.status,
    puzzleState.playerColor,
    puzzleState.selectedColor,
  );
  const status = PUZZLE_STATUS_LINES[statusKey];
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
      <PuzzleHeader
        index={index}
        kind={puzzle.kind}
        playerColor={puzzleState.playerColor}
        titleId={titleId}
        total={total}
      />
      <PuzzleDifficultyPicker current={difficulty} onSelect={onDifficultyChange} />
      <BoardPanel options={boardOptions} />
      <PuzzleStatusBanner speech={status} solved={solved} statusKey={statusKey} tone={tone} />
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
