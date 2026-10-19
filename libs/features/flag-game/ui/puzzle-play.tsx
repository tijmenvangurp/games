import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@shared/lib";
import { PuzzleMap } from "./puzzle-map";
import { DragGhost } from "./puzzle-ghost";
import { PuzzleTray } from "./puzzle-tray";
import {
  PUZZLE_MAP_HEIGHT,
  PUZZLE_MAP_WIDTH,
  type PuzzleState,
  useFlagStore,
} from "../model/use-flags-store";

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
  const x = ((clientX - box.left) * PUZZLE_MAP_WIDTH) / box.width;
  const y = ((clientY - box.top) * PUZZLE_MAP_HEIGHT) / box.height;

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
        Kaart laden…
      </p>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold text-muted-foreground">
          De kaart kon niet laden. Probeer het nog eens.
        </p>
        <button
          className="rounded-xl border bg-card px-4 py-2 text-sm font-bold"
          type="button"
          onClick={() => void useFlagStore.getState().startPuzzle()}
        >
          Opnieuw
        </button>
      </div>
    );
  }

  const { round, map, selected, placed, feedback } = puzzle;
  const total = round.questions.length;
  const placedSet = new Set(placed);
  const names = new Map(
    round.questions.map((question) => [question.subject.code, question.subject.name]),
  );
  const pieces = new Map(map.pieces.map((piece) => [piece.code, piece]));
  const selectedName = selected ? names.get(selected) : undefined;
  const feedbackText = describeFeedback(feedback, selectedName);

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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <header className="flex items-center justify-between rounded-2xl border bg-card px-3 py-2 shadow-sm">
        <p className="text-sm font-black text-muted-foreground">
          {placed.length} van {total} geplaatst
        </p>
        <div className="flex items-center gap-3 text-sm font-bold">
          <span aria-label={`${stars} sterren`}>⭐ {stars}</span>
          {streak > 0 ? <span aria-label={`${streak} op een rij`}>🔥 {streak}</span> : null}
        </div>
      </header>

      <section className="rounded-3xl border bg-card p-3 shadow-sm">
        <PuzzleMap
          areas={map.areas}
          level={round.level}
          names={names}
          placed={placedSet}
          selected={selected}
          svgRef={svgRef}
          total={total}
          onPlace={placeOnMap}
        />

        <p
          aria-live="polite"
          className={cn(
            "mt-2 text-center text-sm font-semibold",
            feedback?.kind === "correct" || feedback?.kind === "revealed"
              ? "text-emerald-700"
              : feedback?.kind === "wrong"
                ? "text-rose-600"
                : "text-muted-foreground",
          )}
        >
          {feedbackText}
        </p>
      </section>

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

      {ghost ? <DragGhost ghost={ghost} piece={pieces.get(ghost.code)} /> : null}
    </div>
  );
}

function describeFeedback(
  feedback: PuzzleState["feedback"],
  selectedName: string | undefined,
): string {
  if (!feedback) {
    return selectedName ? `Waar ligt ${selectedName}?` : "Kies een stuk en leg het op de kaart.";
  }
  if (feedback.kind === "correct") {
    return `Goed! ${feedback.name} ligt op de juiste plek.`;
  }
  if (feedback.kind === "revealed") {
    return `Hier hoort ${feedback.name}.`;
  }
  if (feedback.wrongName) {
    return `Dat is ${feedback.wrongName}. Zoek ${feedback.name}.`;
  }

  return `Leg ${feedback.name} op het land.`;
}
