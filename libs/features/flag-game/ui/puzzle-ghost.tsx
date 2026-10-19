import type { PuzzlePiece } from "@entities/geography";
import { useFlagStore } from "../model/use-flags-store";
import { PieceShape } from "./puzzle-tray";

interface DragGhostProps {
  ghost: { code: string; x: number; y: number };
  piece: PuzzlePiece | undefined;
}

/** The piece that follows the finger while dragging. */
export function DragGhost({ ghost, piece }: DragGhostProps) {
  const name = useFlagStore((state) =>
    state.puzzle?.round.questions.find((question) => question.country.code === ghost.code),
  )?.country.name;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-50 size-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-primary bg-white/90 p-1 shadow-lg"
        style={{ left: ghost.x, top: ghost.y }}
      >
        <PieceShape piece={piece} />
      </div>
      <span aria-live="assertive" className="sr-only">
        {name ? `${name} vasthouden` : ""}
      </span>
    </>
  );
}
