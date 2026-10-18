import { useEffect, useState } from "react";
import { playSound } from "@shared/lib";
import { useWordSearchStore } from "../model/use-word-search-store";
import { WordSearchBoard } from "./word-search-board";
import { WordSearchSidebar } from "./word-search-sidebar";

export function WordSearchPlay() {
  const puzzle = useWordSearchStore((state) => state.puzzle);
  const found = useWordSearchStore((state) => state.found);
  const lastFound = useWordSearchStore((state) => state.lastFound);
  const selected = useWordSearchStore((state) => state.selected);
  const wrong = useWordSearchStore((state) => state.wrong);
  const hint = useWordSearchStore((state) => state.hint);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!wrong) {
      return;
    }
    const timer = window.setTimeout(() => useWordSearchStore.getState().clearWrong(), 800);
    return () => window.clearTimeout(timer);
  }, [wrong]);

  useEffect(() => {
    if (!hint) {
      return;
    }
    const timer = window.setTimeout(() => useWordSearchStore.getState().clearHint(), 2200);
    return () => window.clearTimeout(timer);
  }, [hint]);

  if (!puzzle) {
    return null;
  }

  const words = puzzle.placements.map((placement) => placement.word);
  const complete = found.length === words.length;
  const nextWord = words.find((word) => !found.includes(word));

  const handleNew = () => {
    setZoomed(false);
    playSound("tap");
    useWordSearchStore.getState().newPuzzle();
  };

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4">
      <div className="lg:order-1 lg:col-span-2">
        <WordSearchBoard
          found={found}
          hintCells={hint?.cells ?? []}
          puzzle={puzzle}
          selected={selected}
          wrong={wrong}
          zoomed={zoomed}
          onCellClick={(cell) => useWordSearchStore.getState().tapCell(cell)}
        />
      </div>

      <WordSearchSidebar
        complete={complete}
        found={found}
        lastFound={lastFound}
        nextWord={nextWord}
        selectedCount={selected.length}
        words={words}
        wrong={wrong}
        zoomed={zoomed}
        onHint={(word) => useWordSearchStore.getState().showHint(word)}
        onNew={handleNew}
        onToggleZoom={() => setZoomed((value) => !value)}
      />
    </div>
  );
}
