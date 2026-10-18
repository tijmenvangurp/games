import { useId, useMemo, type CSSProperties } from "react";
import type { Square } from "chess.js";
import { Chessboard, type ChessboardOptions } from "react-chessboard";
import { cn } from "@shared/lib";
import { Button, Check, Play, RotateCcw, Sparkles } from "@shared/ui";
import { levelFor, nextLevelId } from "../model/levels";
import {
  TUTORIAL_LEVEL_IDS,
  type TutorialFeedback,
  type TutorialLevel,
  type TutorialLevelId,
  type TutorialMove,
  type TutorialStatus,
  type UseChessTutorialResult,
} from "../model/types";
import { useChessTutorial } from "../model/useChessTutorial";

interface TutorialBoardProps {
  readonly initialLevelId?: TutorialLevelId;
  readonly onComplete?: (level: TutorialLevel) => void;
}

interface SquareStyleInput {
  readonly targetSquare: Square | undefined;
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly lastMove: TutorialMove | null;
}

function squareStylesFor({
  targetSquare,
  selectedSquare,
  legalTargets,
  lastMove,
}: SquareStyleInput): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};

  const merge = (square: Square, style: CSSProperties) => {
    styles[square] = { ...styles[square], ...style };
  };

  if (lastMove) {
    const lastMoveStyle: CSSProperties = {
      backgroundColor: "rgba(251, 191, 36, 0.22)",
    };
    merge(lastMove.from, lastMoveStyle);
    merge(lastMove.to, lastMoveStyle);
  }

  for (const square of legalTargets) {
    merge(square, {
      backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.7) 0 15%, transparent 16%)",
      boxShadow: "inset 0 0 0 4px rgba(13, 148, 136, 0.4)",
    });
  }

  if (targetSquare) {
    merge(targetSquare, {
      backgroundColor: "rgba(253, 230, 138, 0.42)",
      boxShadow: "inset 0 0 0 5px #f59e0b",
    });
  }

  if (selectedSquare) {
    merge(selectedSquare, {
      boxShadow: "inset 0 0 0 6px #0284c7",
    });
  }

  return styles;
}

function boardOptionsFor(
  tutorial: UseChessTutorialResult,
  squareStyles: Record<string, CSSProperties>,
): ChessboardOptions {
  return {
    position: tutorial.fen,
    boardOrientation: "white",
    showNotation: true,
    allowDragging: tutorial.status === "playing",
    allowDragOffBoard: false,
    allowDrawingArrows: false,
    animationDurationInMs: 160,
    boardStyle: {
      borderRadius: "1.25rem",
      overflow: "hidden",
      boxShadow: "0 24px 60px -32px rgba(15, 23, 42, 0.55)",
    },
    lightSquareStyle: { backgroundColor: "#fef3c7" },
    darkSquareStyle: { backgroundColor: "#7dd3fc" },
    lightSquareNotationStyle: { color: "#92400e", opacity: 1 },
    darkSquareNotationStyle: { color: "#075985", opacity: 1 },
    alphaNotationStyle: {
      fontSize: "clamp(12px, 3.2vw, 18px)",
      fontWeight: 800,
      right: 5,
      bottom: 3,
    },
    numericNotationStyle: {
      fontSize: "clamp(12px, 3.2vw, 18px)",
      fontWeight: 800,
      left: 5,
      top: 3,
    },
    squareStyles,
    canDragPiece: ({ isSparePiece, piece }) => !isSparePiece && piece.pieceType.startsWith("w"),
    onPieceDrop: ({ sourceSquare, targetSquare }) =>
      tutorial.onPieceDrop(sourceSquare, targetSquare),
    onSquareClick: ({ square }) => tutorial.onSquareClick(square),
  };
}

interface TutorialHeaderProps {
  readonly currentIndex: number;
  readonly level: TutorialLevel;
  readonly titleId: string;
}

function TutorialHeader({ currentIndex, level, titleId }: TutorialHeaderProps) {
  return (
    <header className="space-y-1 text-center">
      <p className="text-xs font-black uppercase tracking-widest text-sky-700">
        Schaakles {currentIndex + 1} van {TUTORIAL_LEVEL_IDS.length}
      </p>
      <h2 id={titleId} className="text-2xl font-black text-slate-900 sm:text-3xl">
        {level.title}
      </h2>
      <p className="text-sm font-semibold text-slate-600">{level.description}</p>
    </header>
  );
}

interface LevelPickerProps {
  readonly currentLevelId: TutorialLevelId;
  readonly onSelect: (levelId: TutorialLevelId) => void;
}

function LevelPicker({ currentLevelId, onSelect }: LevelPickerProps) {
  return (
    <nav aria-label="Kies een schaakles" className="grid grid-cols-3 gap-2">
      {TUTORIAL_LEVEL_IDS.map((levelId) => {
        const level = levelFor(levelId);
        const active = levelId === currentLevelId;

        return (
          <button
            key={levelId}
            type="button"
            aria-pressed={active}
            className={cn(
              "min-h-11 rounded-xl border-2 px-2 py-2 text-xs font-bold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 sm:text-sm",
              active
                ? "border-sky-500 bg-sky-100 text-sky-950"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
            onClick={() => onSelect(levelId)}
          >
            {level.title}
          </button>
        );
      })}
    </nav>
  );
}

function HintCard({ hint }: { readonly hint: string }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-950">
      <p className="flex items-start gap-2">
        <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <span>{hint}</span>
      </p>
    </div>
  );
}

function TargetBadge({ targetSquare }: { readonly targetSquare: Square | undefined }) {
  if (!targetSquare) {
    return null;
  }

  return (
    <p className="text-center text-sm font-bold text-slate-700">
      <span aria-hidden="true">⭐</span> Zet de ster op{" "}
      <span className="rounded-lg bg-amber-200 px-2 py-0.5 font-black text-amber-950">
        {targetSquare}
      </span>
    </p>
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

interface StatusBannerProps {
  readonly feedback: TutorialFeedback;
  readonly moveCount: number;
  readonly status: TutorialStatus;
  readonly targetSquare: Square | undefined;
}

function statusTone(status: TutorialStatus, feedback: TutorialFeedback): string {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-900";
  }

  if (feedback === "illegal") {
    return "bg-rose-100 text-rose-900";
  }

  return "bg-slate-100 text-slate-700";
}

function StatusMessage({ feedback, moveCount, status, targetSquare }: StatusBannerProps) {
  if (status === "completed") {
    return (
      <>
        <Check aria-hidden="true" className="size-5 shrink-0" />
        <span>
          Gelukt! Je hebt de ster
          {targetSquare ? ` op ${targetSquare}` : ""} gehaald.
        </span>
      </>
    );
  }

  if (feedback === "illegal") {
    return <span>Die zet mag niet. Kijk naar de groene stippen.</span>;
  }

  return (
    <span>
      Sleep het stuk naar een groene stip, of tik eerst op het stuk. Het gouden vak is de ster.
      {moveCount > 0 ? ` Je deed al ${moveCount} ${moveCount === 1 ? "zet" : "zetten"}.` : ""}
    </span>
  );
}

function StatusBanner({ feedback, moveCount, status, targetSquare }: StatusBannerProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-center text-sm font-bold",
        statusTone(status, feedback),
      )}
    >
      <StatusMessage
        feedback={feedback}
        moveCount={moveCount}
        status={status}
        targetSquare={targetSquare}
      />
    </div>
  );
}

interface TutorialNavigationProps {
  readonly canContinue: boolean;
  readonly onNext: () => void;
  readonly onReset: () => void;
}

function TutorialNavigation({ canContinue, onNext, onReset }: TutorialNavigationProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button size="lg" variant="outline" onClick={onReset}>
        <RotateCcw aria-hidden="true" className="size-5" />
        Opnieuw
      </Button>
      <Button size="lg" variant="success" disabled={!canContinue} onClick={onNext}>
        <Play aria-hidden="true" className="size-5" />
        Volgende
      </Button>
    </div>
  );
}

export function TutorialBoard({
  initialLevelId = TUTORIAL_LEVEL_IDS[0],
  onComplete,
}: TutorialBoardProps) {
  const tutorial = useChessTutorial({ initialLevelId, onComplete });
  const titleId = useId();

  const squareStyles = useMemo(
    () =>
      squareStylesFor({
        targetSquare: tutorial.level.targetSquare,
        selectedSquare: tutorial.selectedSquare,
        legalTargets: tutorial.legalTargets,
        lastMove: tutorial.lastMove,
      }),
    [
      tutorial.level.targetSquare,
      tutorial.selectedSquare,
      tutorial.legalTargets,
      tutorial.lastMove,
    ],
  );

  const currentIndex = TUTORIAL_LEVEL_IDS.indexOf(tutorial.level.id);
  const nextId = nextLevelId(tutorial.level.id);

  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <TutorialHeader currentIndex={currentIndex} level={tutorial.level} titleId={titleId} />
      <LevelPicker currentLevelId={tutorial.level.id} onSelect={tutorial.loadLevel} />
      <HintCard hint={tutorial.level.hint} />
      <TargetBadge targetSquare={tutorial.level.targetSquare} />
      <BoardPanel options={boardOptionsFor(tutorial, squareStyles)} />
      <StatusBanner
        feedback={tutorial.feedback}
        moveCount={tutorial.moveCount}
        status={tutorial.status}
        targetSquare={tutorial.level.targetSquare}
      />
      <TutorialNavigation
        canContinue={nextId !== null && tutorial.status === "completed"}
        onNext={() => {
          if (nextId) {
            tutorial.loadLevel(nextId);
          }
        }}
        onReset={tutorial.resetLevel}
      />
    </section>
  );
}
