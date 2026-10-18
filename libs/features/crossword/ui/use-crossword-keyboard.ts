import { useEffect } from "react";
import { useCrosswordStore } from "../model/use-crossword-store";

const MOVES: Record<string, readonly [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export function useCrosswordKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const store = useCrosswordStore.getState();

      if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        store.typeLetter(event.key);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        store.backspace();
        return;
      }

      const move = MOVES[event.key];
      if (move) {
        event.preventDefault();
        store.move(move[0], move[1]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
