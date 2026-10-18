import { useEffect } from "react";
import { useSudokuStore } from "./use-sudoku-store";

type KeyAction =
  | { type: "enter"; value: number }
  | { type: "erase" }
  | { type: "move"; rowDelta: number; colDelta: number };

const MOVE_BY_KEY: Record<string, readonly [number, number]> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};

function resolveKeyAction(key: string, size: number): KeyAction | null {
  if (/^[1-9]$/.test(key)) {
    const value = Number(key);
    return value <= size ? { type: "enter", value } : null;
  }
  if (key === "Backspace" || key === "Delete" || key === "0") {
    return { type: "erase" };
  }
  const move = MOVE_BY_KEY[key];
  return move ? { type: "move", rowDelta: move[0], colDelta: move[1] } : null;
}

function isUndoShortcut(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === "z"
  );
}

function applyAction(store: ReturnType<typeof useSudokuStore.getState>, action: KeyAction): void {
  switch (action.type) {
    case "enter":
      store.enter(action.value);
      break;
    case "erase":
      store.erase();
      break;
    case "move":
      store.move(action.rowDelta, action.colDelta);
      break;
  }
}

/** Arrow keys, digits, Backspace, Delete and Ctrl/Cmd+Z control the puzzle. */
export function useSudokuKeyboard(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const store = useSudokuStore.getState();
      if (isUndoShortcut(event)) {
        event.preventDefault();
        store.undo();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const play = store.play;
      if (!play) {
        return;
      }
      const action = resolveKeyAction(event.key, play.puzzle.size);
      if (!action) {
        return;
      }

      event.preventDefault();
      applyAction(store, action);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
