import { useId } from "react";
import { cn } from "@shared/lib";
import { Button, Check, Play } from "@shared/ui";
import type { ChessPuzzle, PuzzleDifficulty } from "../model/types";
import { PuzzleDifficultyPicker } from "./PuzzleDifficultyPicker";

interface PuzzleOverviewProps {
  readonly difficulty: PuzzleDifficulty;
  readonly puzzles: readonly ChessPuzzle[];
  readonly solved: ReadonlySet<string>;
  readonly onDifficultyChange: (difficulty: PuzzleDifficulty) => void;
  readonly onSelect: (puzzleId: string) => void;
}

export function PuzzleOverview({
  difficulty,
  puzzles,
  solved,
  onDifficultyChange,
  onSelect,
}: PuzzleOverviewProps) {
  const titleId = useId();
  const solvedCount = puzzles.filter((puzzle) => solved.has(puzzle.id)).length;
  const allSolved = puzzles.length > 0 && solvedCount === puzzles.length;
  const nextPuzzle = puzzles.find((puzzle) => !solved.has(puzzle.id)) ?? puzzles[0];
  const progress = puzzles.length > 0 ? (solvedCount / puzzles.length) * 100 : 0;

  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <header className="space-y-1 text-center">
        <h2 id={titleId} className="text-2xl font-black text-slate-900">
          Kies een puzzel
        </h2>
        <p className="text-sm font-semibold text-slate-600">
          {solvedCount} van {puzzles.length} opgelost
        </p>
      </header>

      <PuzzleDifficultyPicker current={difficulty} onSelect={onDifficultyChange} />

      <div
        aria-label="Voortgang"
        aria-valuemax={puzzles.length}
        aria-valuemin={0}
        aria-valuenow={solvedCount}
        aria-valuetext={`${solvedCount} van ${puzzles.length} opgelost`}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {nextPuzzle ? (
        <Button
          className="w-full"
          size="lg"
          variant="success"
          onClick={() => onSelect(nextPuzzle.id)}
        >
          <Play aria-hidden="true" className="size-5" />
          {allSolved ? "Nog een keer" : "Verder"}
        </Button>
      ) : null}

      <nav aria-label="Kies een puzzel" className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {puzzles.map((puzzle, index) => {
          const done = solved.has(puzzle.id);

          return (
            <button
              key={puzzle.id}
              type="button"
              aria-label={`Puzzel ${index + 1}${done ? ", opgelost" : ", nog niet opgelost"}`}
              className={cn(
                "relative flex min-h-12 items-center justify-center rounded-xl border-2 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300",
                done
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
              onClick={() => onSelect(puzzle.id)}
            >
              {index + 1}
              {done ? (
                <Check
                  aria-hidden="true"
                  className="absolute right-1 top-1 size-3.5 text-emerald-600"
                />
              ) : null}
            </button>
          );
        })}
      </nav>
    </section>
  );
}
