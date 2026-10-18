import { useId, useMemo } from "react";
import { Chessboard, type ChessboardOptions } from "react-chessboard";
import { chessBoardOptions, chessSquareStyles, cn } from "@shared/lib";
import { Button, Check, Play, RotateCcw, Sparkles } from "@shared/ui";
import { levelFor, nextLevelId } from "../model/levels";
import {
  TUTORIAL_LEVEL_IDS,
  type TutorialFeedback,
  type TutorialLevel,
  type TutorialLevelId,
  type TutorialStatus,
} from "../model/types";
import { useChessTutorial } from "../model/useChessTutorial";

interface TutorialBoardProps {
  readonly initialLevelId?: TutorialLevelId;
  readonly onComplete?: (level: TutorialLevel) => void;
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

function objectiveText(level: TutorialLevel): string {
  switch (level.goal) {
    case "check":
      return "Zet de zwarte koning schaak.";
    case "checkmate":
      return "Zet de zwarte koning schaakmat.";
    case "castle-kingside":
      return "Rokade: zet de koning op g1.";
    case "castle-queenside":
      return "Rokade: zet de koning op c1.";
    default:
      return level.targetSquare ? `Zet de ster op ${level.targetSquare}.` : "Voltooi de opdracht.";
  }
}

function completionText(level: TutorialLevel): string {
  switch (level.goal) {
    case "check":
      return "Gelukt! Je hebt schaak gezet.";
    case "checkmate":
      return "Schaakmat! Knap gedaan.";
    case "castle-kingside":
    case "castle-queenside":
      return "Gelukt! De koning is gerokeerd.";
    default:
      return level.targetSquare
        ? `Gelukt! Je hebt de ster op ${level.targetSquare} gehaald.`
        : "Gelukt!";
  }
}

function ObjectiveBadge({ level }: { readonly level: TutorialLevel }) {
  if (!level.targetSquare && !level.goal) {
    return null;
  }

  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-sm font-bold text-slate-700">
      {level.targetSquare ? (
        <span aria-hidden="true">⭐</span>
      ) : (
        <Sparkles aria-hidden="true" className="size-4 text-amber-500" />
      )}
      <span>{objectiveText(level)}</span>
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
  readonly level: TutorialLevel;
  readonly moveCount: number;
  readonly status: TutorialStatus;
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

function StatusMessage({ feedback, level, moveCount, status }: StatusBannerProps) {
  if (status === "completed") {
    return (
      <>
        <Check aria-hidden="true" className="size-5 shrink-0" />
        <span>{completionText(level)}</span>
      </>
    );
  }

  if (feedback === "illegal") {
    return <span>Die zet mag niet. Kijk naar de groene stippen.</span>;
  }

  return (
    <span>
      Sleep het stuk naar een groene stip, of tik eerst op het stuk. {objectiveText(level)}
      {moveCount > 0 ? ` Je deed al ${moveCount} ${moveCount === 1 ? "zet" : "zetten"}.` : ""}
    </span>
  );
}

function StatusBanner({ feedback, level, moveCount, status }: StatusBannerProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-center text-sm font-bold",
        statusTone(status, feedback),
      )}
    >
      <StatusMessage feedback={feedback} level={level} moveCount={moveCount} status={status} />
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
      chessSquareStyles({
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

  const boardOptions = chessBoardOptions({
    position: tutorial.fen,
    playerColor: "w",
    allowDragging: tutorial.status === "playing",
    squareStyles,
    onPieceDrop: tutorial.onPieceDrop,
    onSquareClick: tutorial.onSquareClick,
  });

  const currentIndex = TUTORIAL_LEVEL_IDS.indexOf(tutorial.level.id);
  const nextId = nextLevelId(tutorial.level.id);

  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <TutorialHeader currentIndex={currentIndex} level={tutorial.level} titleId={titleId} />
      <LevelPicker currentLevelId={tutorial.level.id} onSelect={tutorial.loadLevel} />
      <HintCard hint={tutorial.level.hint} />
      <ObjectiveBadge level={tutorial.level} />
      <BoardPanel options={boardOptions} />
      <StatusBanner
        feedback={tutorial.feedback}
        level={tutorial.level}
        moveCount={tutorial.moveCount}
        status={tutorial.status}
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
