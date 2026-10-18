import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Cell } from "@entities/word-search";
import { useWordSearchStore } from "../model/use-word-search-store";

interface DragState {
  start: Cell;
  moved: boolean;
}

function cellAtPoint(x: number, y: number): Cell | null {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest<HTMLElement>("[data-row][data-col]");
  if (!cell) {
    return null;
  }

  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  return Number.isInteger(row) && Number.isInteger(col) ? { row, col } : null;
}

/**
 * Turns a pointer drag over the grid into a word selection. Pointer capture
 * starts only after the first move, so a simple tap still produces a normal
 * click for the two-tap and keyboard path.
 */
export function useWordSearchDrag(enabled: boolean) {
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || event.button !== 0) {
      return;
    }

    const cell = cellAtPoint(event.clientX, event.clientY);
    if (!cell) {
      return;
    }

    drag.current = { start: cell, moved: false };
    suppressClick.current = false;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!enabled || !state) {
      return;
    }

    const cell = cellAtPoint(event.clientX, event.clientY);
    if (!cell) {
      return;
    }

    if (!state.moved && (cell.row !== state.start.row || cell.col !== state.start.col)) {
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      useWordSearchStore.getState().startDrag(state.start);
    }
    if (state.moved) {
      useWordSearchStore.getState().dragTo(cell);
    }
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!enabled || !state) {
      return;
    }

    drag.current = null;
    if (!state.moved) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 100);
    useWordSearchStore.getState().commitDrag();
  };

  const cancelDrag = () => {
    if (!enabled) {
      return;
    }
    drag.current = null;
    useWordSearchStore.getState().cancelDrag();
  };

  const consumeClick = (): boolean => {
    if (!suppressClick.current) {
      return false;
    }
    suppressClick.current = false;
    return true;
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: finishDrag,
    onPointerCancel: cancelDrag,
    consumeClick,
  };
}
