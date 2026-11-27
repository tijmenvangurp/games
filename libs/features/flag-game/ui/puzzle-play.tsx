import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { subjectName, subjectNameInSentence, type FlagSubject } from "@entities/geography";
import { useLanguage, useTexts, type Language } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Button, Panel, ScoreHeader } from "@shared/ui";
import { PuzzleMap } from "./puzzle-map";
import { DragGhost } from "./puzzle-ghost";
import { PuzzleTray } from "./puzzle-tray";
import { flagTexts } from "../model/texts";
import { type PuzzleState, useFlagStore } from "../model/use-flags-store";

type FlagTexts = (typeof flagTexts)[Language];

/** Pointer travel below this is a tap, not a drag. */
const DRAG_THRESHOLD = 8;
/** A drop this close (in map units) to a country's centre counts as that country. */
const DROP_RADIUS = 26;

interface Ghost {
  code: string;
  x: number;
  y: number;
}

interface DragStart {
  code: string;
  startX: number;
  startY: number;
  moved: boolean;
}

function pointedCountry(clientX: number, clientY: number): string | undefined {
  const element = document.elementFromPoint(clientX, clientY);

  return element?.closest("[data-country]")?.getAttribute("data-country") ?? undefined;
}

function closer(
  candidate: { code: string; distance: number },
  nearest: { code: string; distance: number } | undefined,
): boolean {
  return !nearest || candidate.distance < nearest.distance;
}

function nearestCountry(puzzle: PuzzleState, x: number, y: number): string | undefined {
  let nearest: { code: string; distance: number } | undefined;

  for (const area of puzzle.map.areas) {
    const candidate = { code: area.code, distance: Math.hypot(area.x - x, area.y - y) };
    if (candidate.distance <= DROP_RADIUS && closer(candidate, nearest)) {
      nearest = candidate;
    }
  }

  return nearest?.code;
}

/** Finds the country under the pointer, or the nearest centre for tiny states. */
function countryAt(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement | null,
): string | undefined {
  const direct = pointedCountry(clientX, clientY);
  if (direct) {
    return direct;
  }

  const puzzle = useFlagStore.getState().puzzle;
  if (!svg || !puzzle) {
    return undefined;
  }

  const box = svg.getBoundingClientRect();
  const x = ((clientX - box.left) * puzzle.map.width) / box.width;
  const y = ((clientY - box.top) * puzzle.map.height) / box.height;

  return nearestCountry(puzzle, x, y);
}

export function PuzzlePlay() {
  const puzzle = useFlagStore((state) => state.puzzle);
  const loading = useFlagStore((state) => state.puzzleLoading);
  const error = useFlagStore((state) => state.puzzleError);
  const stars = useFlagStore((state) => state.stars);
  const streak = useFlagStore((state) => state.streak);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragStart | null>(null);
  const dropAtRef = useRef(0);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const language = useLanguage();
  const t = useTexts(flagTexts);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const moved =
        drag.moved ||
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > DRAG_THRESHOLD;
      dragRef.current = { ...drag, moved };
      setGhost({ code: drag.code, x: event.clientX, y: event.clientY });
    };

    const finish = (event: PointerEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setGhost(null);
      if (!drag?.moved) {
        return;
      }
      dropAtRef.current = Date.now();
      useFlagStore.getState().placePiece(countryAt(event.clientX, event.clientY, svgRef.current));
    };

    const cancel = () => {
      dragRef.current = null;
      setGhost(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  if (loading) {
    return (
      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {t.loadingMap}
      </p>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold text-muted-foreground">{t.mapFailed}</p>
        <Button variant="outline" onClick={() => void useFlagStore.getState().startPuzzle()}>
          {t.retry}
        </Button>
      </div>
    );
  }

  const { round, map, selected, placed, feedback } = puzzle;
  const total = round.questions.length;
  const placedSet = new Set(placed);
  const subjects = new Map(
    round.questions.map((question) => [question.subject.code, question.subject]),
  );
  const names = new Map(
    round.questions.map((question) => [
      question.subject.code,
      subjectName(question.subject, language),
    ]),
  );
  const pieces = new Map(map.pieces.map((piece) => [piece.code, piece]));
  const selectedSubject = selected ? subjects.get(selected) : undefined;
  const feedbackText = describeFeedback(feedback, selectedSubject, t, language);

  const startDrag = (event: ReactPointerEvent, code: string) => {
    event.preventDefault();
    useFlagStore.getState().selectPiece(code);
    dragRef.current = { code, startX: event.clientX, startY: event.clientY, moved: false };
    setGhost({ code, x: event.clientX, y: event.clientY });
  };

  /** After a keyboard selection, hand the focus to the map so Enter can place. */
  const focusFirstTarget = () => {
    window.setTimeout(() => {
      const target = svgRef.current?.querySelector<SVGPathElement>(
        'path[data-country][role="button"][tabindex="0"]',
      );
      target?.focus();
    }, 0);
  };

  const placeOnMap = (code: string) => {
    // A click that follows a drag was already handled on pointerup.
    if (Date.now() - dropAtRef.current < 400) {
      return;
    }
    useFlagStore.getState().placePiece(code);
  };

  return (
    <div className="mx-auto my-auto flex w-full max-w-2xl flex-col gap-3 lg:max-w-4xl">
      <ScoreHeader progress={t.placed(placed.length, total)} stars={stars} streak={streak} />

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
        <Panel as="section" padding="sm">
          <PuzzleMap
            areas={map.areas}
            level={round.level}
            names={names}
            placed={placedSet}
            height={map.height}
            selected={selected}
            svgRef={svgRef}
            total={total}
            width={map.width}
            onPlace={placeOnMap}
          />

          <p
            aria-live="polite"
            className={cn(
              "mt-2 text-center text-sm font-semibold",
              feedback?.kind === "correct" || feedback?.kind === "revealed"
                ? "text-success-ink"
                : feedback?.kind === "wrong"
                  ? "text-danger-ink"
                  : "text-muted-foreground",
            )}
          >
            {feedbackText}
          </p>
        </Panel>

        <PuzzleTray
          pieces={pieces}
          placed={placedSet}
          subjects={round.questions.map((question) => question.subject)}
          selected={selected}
          onGrab={startDrag}
          onKeyboardSelect={(code) => {
            useFlagStore.getState().selectPiece(code);
            focusFirstTarget();
          }}
        />
      </div>

      {ghost ? <DragGhost ghost={ghost} piece={pieces.get(ghost.code)} /> : null}
    </div>
  );
}

function describeFeedback(
  feedback: PuzzleState["feedback"],
  selected: FlagSubject | undefined,
  t: FlagTexts,
  language: Language,
): string {
  const name = (subject: FlagSubject) => subjectNameInSentence(subject, language);

  if (!feedback) {
    return selected ? t.whereIs(name(selected)) : t.pickPiece;
  }
  if (feedback.kind === "correct") {
    return t.correct(name(feedback.subject));
  }
  if (feedback.kind === "revealed") {
    return t.revealed(name(feedback.subject));
  }
  if (feedback.wrong) {
    return t.wrongPlace(name(feedback.wrong), name(feedback.subject));
  }

  return t.dropOnMap(name(feedback.subject));
}
