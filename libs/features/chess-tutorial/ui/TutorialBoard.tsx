import { useId, useMemo, useRef } from "react";
import type { PieceSymbol } from "chess.js";
import { Chessboard, type ChessboardOptions } from "react-chessboard";
import { chessBoardOptions, chessSquareStyles, cn } from "@shared/lib";
import { Button, Eye, LayoutGrid, Lightbulb, Play, RotateCcw } from "@shared/ui";
import { levelFor, nextLevelId } from "../model/levels";
import {
  TUTORIAL_LEVEL_IDS,
  type TutorialFeedback,
  type TutorialLevel,
  type TutorialLevelId,
  type TutorialPreview,
  type TutorialStatus,
} from "../model/types";
import { useChessTutorial } from "../model/useChessTutorial";

const PIECE_GLYPHS: Record<PieceSymbol, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

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
    <header className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-3xl leading-none text-sky-900 shadow-sm"
      >
        {PIECE_GLYPHS[level.playerPiece]}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-sky-700">
          Les {currentIndex + 1} van {TUTORIAL_LEVEL_IDS.length}
        </p>
        <h2 id={titleId} className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">
          {level.title}
        </h2>
      </div>
    </header>
  );
}

interface LevelPickerProps {
  readonly currentLevelId: TutorialLevelId;
  readonly onSelect: (levelId: TutorialLevelId) => void;
}

function LevelPicker({ currentLevelId, onSelect }: LevelPickerProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={detailsRef} className="rounded-2xl border border-slate-200 bg-white/80">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 [&::-webkit-details-marker]:hidden">
        <LayoutGrid aria-hidden="true" className="size-4" />
        Kies een les
      </summary>
      <nav
        aria-label="Kies een schaakles"
        className="grid grid-cols-5 gap-2 p-3 pt-0 sm:grid-cols-9"
      >
        {TUTORIAL_LEVEL_IDS.map((levelId, index) => {
          const level = levelFor(levelId);
          const active = levelId === currentLevelId;

          return (
            <button
              key={levelId}
              type="button"
              aria-label={`Les ${index + 1}: ${level.title}`}
              aria-pressed={active}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300",
                active
                  ? "border-sky-500 bg-sky-100 text-sky-950"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
              title={level.title}
              onClick={() => {
                onSelect(levelId);
                if (detailsRef.current) {
                  detailsRef.current.open = false;
                }
              }}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {PIECE_GLYPHS[level.playerPiece]}
              </span>
              <span aria-hidden="true" className="text-xs leading-tight">
                {index + 1}
              </span>
            </button>
          );
        })}
      </nav>
    </details>
  );
}

function BoardPanel({
  label,
  options,
}: {
  readonly label: string;
  readonly options: ChessboardOptions;
}) {
  return (
    <div
      aria-label={`Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Sleep een stuk of tik erop. ${label}`}
      className="mx-auto w-full max-w-lg"
      role="group"
    >
      <div className="aspect-square w-full touch-manipulation">
        <Chessboard options={options} />
      </div>
    </div>
  );
}

interface CoachBubbleProps {
  readonly feedback: TutorialFeedback;
  readonly level: TutorialLevel;
  readonly preview: TutorialPreview | null;
  readonly selectedSquare: string | null;
  readonly status: TutorialStatus;
}

function terminalCoachText(
  status: TutorialStatus,
  feedback: TutorialFeedback,
  level: TutorialLevel,
): string | null {
  if (status === "completed") {
    return level.success ?? "Ster! Knap gedaan.";
  }

  if (status === "stuck") {
    return "Oei! De rokade kan niet meer. Druk op Opnieuw.";
  }

  if (feedback === "illegal") {
    return "Die mag niet. Kies een groene stip.";
  }

  if (feedback === "blocked") {
    return "Nog niet! Kies eerst een blauwe stip.";
  }

  if (feedback === "hint") {
    return "Kijk! Sleep naar de groene stip.";
  }

  return null;
}

function coachText({ feedback, level, preview, selectedSquare, status }: CoachBubbleProps): string {
  const terminal = terminalCoachText(status, feedback, level);
  if (terminal) {
    return terminal;
  }

  if (feedback === "moved") {
    return (
      level.nextStep ??
      (level.targetSquare ? "Goed! Ga verder naar de ster." : "Goed! Nog een zet.")
    );
  }

  if (preview) {
    return `${level.preview} Tik op een blauwe stip.`;
  }

  if (selectedSquare) {
    return "Tik op een groene stip.";
  }

  return level.instruction;
}

function coachTone(
  status: TutorialStatus,
  feedback: TutorialFeedback,
  preview: TutorialPreview | null,
): string {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-950";
  }

  if (status === "stuck") {
    return "bg-amber-100 text-amber-950";
  }

  if (feedback === "illegal") {
    return "bg-rose-100 text-rose-950";
  }

  if (feedback === "blocked") {
    return "bg-amber-100 text-amber-950";
  }

  if (feedback === "hint") {
    return "bg-sky-100 text-sky-950";
  }

  if (feedback === "moved") {
    return "bg-emerald-50 text-emerald-900";
  }

  if (preview) {
    return "bg-sky-100 text-sky-950";
  }

  return "bg-sky-50 text-sky-950";
}

function coachIcon(
  status: TutorialStatus,
  feedback: TutorialFeedback,
  preview: TutorialPreview | null,
): string {
  if (status === "completed") {
    return "⭐";
  }

  if (status === "stuck") {
    return "🔁";
  }

  if (feedback === "illegal") {
    return "🤔";
  }

  if (feedback === "blocked") {
    return "👉";
  }

  if (feedback === "hint") {
    return "💡";
  }

  if (feedback === "moved") {
    return "👍";
  }

  if (preview) {
    return "👀";
  }

  return "👉";
}

function CoachBubble({ feedback, level, preview, selectedSquare, status }: CoachBubbleProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold leading-snug sm:text-lg",
        coachTone(status, feedback, preview),
      )}
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        {coachIcon(status, feedback, preview)}
      </span>
      <span>{coachText({ feedback, level, preview, selectedSquare, status })}</span>
    </div>
  );
}

interface TutorialActionsProps {
  readonly canContinue: boolean;
  readonly playDisabled: boolean;
  readonly previewActive: boolean;
  readonly onHint: () => void;
  readonly onNext: () => void;
  readonly onPreview: () => void;
  readonly onReset: () => void;
}

function TutorialActions({
  canContinue,
  playDisabled,
  previewActive,
  onHint,
  onNext,
  onPreview,
  onReset,
}: TutorialActionsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Button
          aria-pressed={previewActive}
          className={cn(
            "min-h-12 px-2 text-xs sm:text-sm",
            previewActive && "border-sky-400 bg-sky-100 text-sky-950",
          )}
          disabled={playDisabled}
          variant="outline"
          onClick={onPreview}
        >
          <Eye aria-hidden="true" className="size-5" />
          Kijk
        </Button>
        <Button
          className="min-h-12 px-2 text-xs sm:text-sm"
          disabled={playDisabled}
          variant="outline"
          onClick={onHint}
        >
          <Lightbulb aria-hidden="true" className="size-5 text-amber-500" />
          Toon zet
        </Button>
        <Button className="min-h-12 px-2 text-xs sm:text-sm" variant="outline" onClick={onReset}>
          <RotateCcw aria-hidden="true" className="size-5" />
          Opnieuw
        </Button>
      </div>
      {canContinue ? (
        <Button className="w-full animate-pop" size="lg" variant="success" onClick={onNext}>
          <Play aria-hidden="true" className="size-5" />
          Volgende les
        </Button>
      ) : null}
    </div>
  );
}

function objectiveLabel(level: TutorialLevel): string {
  switch (level.goal) {
    case "check":
      return "Doel: de zwarte koning schaak zetten.";
    case "checkmate":
      return "Doel: de zwarte koning schaakmat zetten.";
    case "castle-kingside":
      return "Doel: rokade, de koning naar g1.";
    case "castle-queenside":
      return "Doel: rokade, de koning naar c1.";
    default:
      return level.targetSquare ? `Doel: de ster op ${level.targetSquare}.` : "";
  }
}

function WhyCard({ level }: { readonly level: TutorialLevel }) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white/80">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 [&::-webkit-details-marker]:hidden">
        <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
        Waarom?
      </summary>
      <div className="space-y-2 px-4 pb-4 text-sm font-medium text-slate-600">
        <p>{level.explanation}</p>
        <p className="font-bold text-sky-800">Tip: {level.hint}</p>
      </div>
    </details>
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
        targetSquare: tutorial.status === "playing" ? tutorial.level.targetSquare : null,
        selectedSquare: tutorial.selectedSquare,
        legalTargets: tutorial.legalTargets,
        previewSquare: tutorial.preview?.square,
        previewTargets: tutorial.preview?.targets,
        lastMove: tutorial.lastMove,
        hintMove: tutorial.hintMove,
      }),
    [
      tutorial.status,
      tutorial.level.targetSquare,
      tutorial.selectedSquare,
      tutorial.legalTargets,
      tutorial.preview,
      tutorial.lastMove,
      tutorial.hintMove,
    ],
  );

  const targetSquare = tutorial.status === "playing" ? tutorial.level.targetSquare : undefined;
  const boardOptions: ChessboardOptions = {
    ...chessBoardOptions({
      position: tutorial.fen,
      playerColor: "w",
      allowDragging: tutorial.status === "playing",
      squareStyles,
      onPieceDrop: tutorial.onPieceDrop,
      onSquareClick: tutorial.onSquareClick,
    }),
    squareRenderer: ({ square, children }) => (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          ...squareStyles[square],
        }}
      >
        {children}
        {square === targetSquare ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid animate-pulse place-items-center text-3xl motion-reduce:animate-none sm:text-4xl"
          >
            ⭐
          </span>
        ) : null}
      </div>
    ),
  };

  const currentIndex = TUTORIAL_LEVEL_IDS.indexOf(tutorial.level.id);
  const nextId = nextLevelId(tutorial.level.id);

  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <TutorialHeader currentIndex={currentIndex} level={tutorial.level} titleId={titleId} />
      <BoardPanel label={objectiveLabel(tutorial.level)} options={boardOptions} />
      <CoachBubble
        feedback={tutorial.feedback}
        level={tutorial.level}
        preview={tutorial.preview}
        selectedSquare={tutorial.selectedSquare}
        status={tutorial.status}
      />
      <TutorialActions
        canContinue={nextId !== null && tutorial.status === "completed"}
        playDisabled={tutorial.status !== "playing"}
        previewActive={tutorial.preview !== null}
        onHint={tutorial.showHint}
        onNext={() => {
          if (nextId) {
            tutorial.loadLevel(nextId);
          }
        }}
        onPreview={tutorial.togglePreview}
        onReset={tutorial.resetLevel}
      />
      <LevelPicker currentLevelId={tutorial.level.id} onSelect={tutorial.loadLevel} />
      <WhyCard level={tutorial.level} />
    </section>
  );
}
