import { useId, useMemo, useRef } from "react";
import type { PieceSymbol } from "chess.js";
import type { ChessboardOptions } from "react-chessboard";
import { chessBoardOptions, chessSquareStyles, cn, useAutoSpeech } from "@shared/lib";
import {
  ArrowRight,
  Button,
  Check,
  ChessBoard,
  Disclosure,
  Eye,
  LayoutGrid,
  Lightbulb,
  Play,
  RotateCcw,
  SpeechButton,
  SpokenText,
  Star,
  StatusBanner,
  X,
  type StatusTone,
} from "@shared/ui";
import { CHESS_LEVEL_LINES, coachSpeechFor, type CoachSpeech } from "../model/audio";
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
        className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary-soft text-3xl leading-none text-primary"
      >
        {PIECE_GLYPHS[level.playerPiece]}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold tabular-nums text-muted-foreground">
          Les {currentIndex + 1} van {TUTORIAL_LEVEL_IDS.length}
        </p>
        <h2
          id={titleId}
          className="font-display text-2xl leading-tight tracking-tight text-foreground"
        >
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
    <Disclosure
      detailsRef={detailsRef}
      icon={<LayoutGrid className="size-4 text-primary" />}
      summary="Kies een les"
    >
      <nav aria-label="Kies een schaakles" className="grid grid-cols-5 gap-2 sm:grid-cols-9">
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
                "flex min-h-11 flex-col items-center justify-center rounded-xl border px-1 py-1 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border-strong hover:bg-background-subtle",
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
              <span aria-hidden="true" className="text-xs leading-tight tabular-nums">
                {index + 1}
              </span>
            </button>
          );
        })}
      </nav>
    </Disclosure>
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
    <ChessBoard
      label={`Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Tik op een stuk om te kijken waar het heen kan. Sleep een stuk om te zetten. ${label}`}
      options={options}
    />
  );
}

interface CoachBubbleProps {
  readonly feedback: TutorialFeedback;
  readonly preview: TutorialPreview | null;
  readonly speech: CoachSpeech;
  readonly status: TutorialStatus;
}

function coachTone(
  status: TutorialStatus,
  feedback: TutorialFeedback,
  preview: TutorialPreview | null,
): StatusTone {
  if (status === "completed" || feedback === "moved") {
    return "success";
  }

  if (status === "stuck") {
    return "warning";
  }

  if (feedback === "illegal") {
    return "danger";
  }

  if (feedback === "hint" || preview) {
    return "primary";
  }

  return "neutral";
}

function coachIcon(
  status: TutorialStatus,
  feedback: TutorialFeedback,
  preview: TutorialPreview | null,
) {
  if (status === "completed") {
    return <Star className="size-6 fill-warning text-warning" />;
  }

  if (status === "stuck") {
    return <RotateCcw className="size-6" />;
  }

  if (feedback === "illegal") {
    return <X className="size-6" />;
  }

  if (feedback === "hint") {
    return <Lightbulb className="size-6" />;
  }

  if (feedback === "moved") {
    return <Check className="size-6" />;
  }

  if (preview) {
    return <Eye className="size-6" />;
  }

  return <ArrowRight className="size-6" />;
}

function CoachBubble({ feedback, preview, speech, status }: CoachBubbleProps) {
  return (
    <StatusBanner
      action={<SpeechButton label="Beluister de coach" line={speech.lines} />}
      aria-atomic="true"
      className="min-h-14 text-base sm:text-lg"
      icon={coachIcon(status, feedback, preview)}
      tone={coachTone(status, feedback, preview)}
    >
      {speech.text}
    </StatusBanner>
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
            previewActive && "border-primary bg-primary/5 text-primary",
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
          <Lightbulb aria-hidden="true" className="size-5 text-warning" />
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
  const speech = CHESS_LEVEL_LINES[level.id];

  return (
    <Disclosure icon={<Lightbulb className="size-4 text-warning" />} summary="Waarom?">
      <div className="space-y-2 text-sm font-medium text-muted-foreground">
        <SpokenText line={speech.explanation} label="Beluister de uitleg" />
        <SpokenText
          className="font-bold text-primary"
          label="Beluister de tip"
          line={speech.hint}
          text={`Tip: ${level.hint}`}
        />
      </div>
    </Disclosure>
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
            className="pointer-events-none absolute inset-0 grid animate-pulse place-items-center motion-reduce:animate-none"
            data-target-square="true"
          >
            <Star className="size-8 fill-warning text-warning" />
          </span>
        ) : null}
      </div>
    ),
  };

  const currentIndex = TUTORIAL_LEVEL_IDS.indexOf(tutorial.level.id);
  const nextId = nextLevelId(tutorial.level.id);
  const coachSpeech = coachSpeechFor(
    tutorial.level,
    tutorial.feedback,
    tutorial.preview,
    tutorial.selectedColor,
    tutorial.selectedSquare,
    tutorial.status,
    tutorial.moveCount,
  );
  useAutoSpeech(coachSpeech.key, coachSpeech.lines);

  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <TutorialHeader currentIndex={currentIndex} level={tutorial.level} titleId={titleId} />
      <BoardPanel label={objectiveLabel(tutorial.level)} options={boardOptions} />
      <CoachBubble
        feedback={tutorial.feedback}
        preview={tutorial.preview}
        speech={coachSpeech}
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
