import { useId, useMemo } from "react";
import { Chessboard, type ChessboardOptions } from "react-chessboard";
import { chessBoardOptions, chessSquareStyles, cn } from "@shared/lib";
import { Button, Check, Lightbulb, Play, RotateCcw } from "@shared/ui";
import { useChessPuzzle } from "../model/useChessPuzzle";
import type { ChessPuzzle, PuzzleFeedback, PuzzleKind, PuzzleStatus } from "../model/types";

interface PuzzlePlayProps {
  readonly puzzle: ChessPuzzle;
  readonly index: number;
  readonly total: number;
  readonly onNext: () => void;
}

function difficultyFor(rating: number): string {
  if (rating <= 500) {
    return "Makkelijk";
  }

  if (rating <= 800) {
    return "Lastig";
  }

  return "Uitdagend";
}

function titleFor(kind: PuzzleKind): string {
  return kind === "mate" ? "Zet schaakmat!" : "Win een stuk!";
}

function promptFor(kind: PuzzleKind, playerColor: "w" | "b"): string {
  const player = playerColor === "w" ? "wit" : "zwart";
  const opponent = playerColor === "w" ? "zwarte" : "witte";

  return kind === "mate"
    ? `Je bent ${player}. Zet de ${opponent} koning schaakmat.`
    : `Je bent ${player}. Welke zet wint een stuk?`;
}

interface PuzzleHeaderProps {
  readonly index: number;
  readonly playerColor: "w" | "b";
  readonly puzzle: ChessPuzzle;
  readonly titleId: string;
  readonly total: number;
}

function PuzzleHeader({ index, playerColor, puzzle, titleId, total }: PuzzleHeaderProps) {
  return (
    <header className="space-y-1 text-center">
      <p className="text-xs font-black uppercase tracking-widest text-teal-700">
        Puzzel {index + 1} van {total} · {difficultyFor(puzzle.rating)}
      </p>
      <h2 id={titleId} className="text-2xl font-black text-slate-900 sm:text-3xl">
        {titleFor(puzzle.kind)}
      </h2>
      <p className="text-sm font-semibold text-slate-600">{promptFor(puzzle.kind, playerColor)}</p>
    </header>
  );
}

function BoardPanel({ options }: { readonly options: ChessboardOptions }) {
  return (
    <div
      aria-label="Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Sleep een stuk of tik erop."
      className="mx-auto w-full max-w-lg"
      role="group"
    >
      <div className="aspect-square w-full touch-manipulation">
        <Chessboard options={options} />
      </div>
    </div>
  );
}

interface PuzzleStatusProps {
  readonly feedback: PuzzleFeedback;
  readonly kind: PuzzleKind;
  readonly status: PuzzleStatus;
}

function statusText(feedback: PuzzleFeedback, kind: PuzzleKind, status: PuzzleStatus): string {
  if (status === "solved") {
    return kind === "mate" ? "Schaakmat! Knap gedaan." : "Gelukt! Je hebt een stuk gewonnen.";
  }

  if (feedback === "wrong") {
    return "Die zet is niet de beste. Probeer nog eens.";
  }

  if (feedback === "correct") {
    return "Goed zo! De tegenstander heeft geantwoord.";
  }

  return "Sleep een stuk of tik erop. Groene stippen zijn legale zetten.";
}

function PuzzleStatusBanner({ feedback, kind, status }: PuzzleStatusProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-center text-sm font-bold",
        status === "solved"
          ? "bg-emerald-100 text-emerald-900"
          : feedback === "wrong"
            ? "bg-rose-100 text-rose-900"
            : feedback === "correct"
              ? "bg-sky-100 text-sky-900"
              : "bg-slate-100 text-slate-700",
      )}
    >
      {status === "solved" ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
      <span>{statusText(feedback, kind, status)}</span>
    </div>
  );
}

interface PuzzleActionsProps {
  readonly solved: boolean;
  readonly onHint: () => void;
  readonly onNext: () => void;
  readonly onReset: () => void;
}

function PuzzleActions({ solved, onHint, onNext, onReset }: PuzzleActionsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button className="min-h-11" disabled={solved} variant="outline" onClick={onHint}>
          <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
          Hint
        </Button>
        <Button className="min-h-11" variant="outline" onClick={onReset}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Opnieuw
        </Button>
      </div>
      <Button className="w-full" disabled={!solved} size="lg" variant="success" onClick={onNext}>
        <Play aria-hidden="true" className="size-5" />
        Volgende puzzel
      </Button>
    </div>
  );
}

export function PuzzlePlay({ index, puzzle, total, onNext }: PuzzlePlayProps) {
  const puzzleState = useChessPuzzle(puzzle);
  const titleId = useId();

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
        playerColor={puzzleState.playerColor}
        puzzle={puzzle}
        titleId={titleId}
        total={total}
      />
      <BoardPanel options={boardOptions} />
      <PuzzleStatusBanner
        feedback={puzzleState.feedback}
        kind={puzzle.kind}
        status={puzzleState.status}
      />
      <PuzzleActions
        solved={puzzleState.status === "solved"}
        onHint={puzzleState.showHint}
        onNext={onNext}
        onReset={puzzleState.resetPuzzle}
      />
    </section>
  );
}
