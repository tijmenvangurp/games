import type { CrosswordEntry } from "@entities/crossword";
import { useCrosswordStore } from "../model/use-crossword-store";
import { CrosswordClues } from "./crossword-clues";
import { CrosswordGrid } from "./crossword-grid";
import { CrosswordKeyboard } from "./crossword-keyboard";
import { useCrosswordKeyboard } from "./use-crossword-keyboard";

function statusText(
  solved: boolean,
  checked: boolean,
  complete: boolean,
  wrongCount: number,
  entry: CrosswordEntry | undefined,
): string {
  if (solved) {
    return "Opgelost! Knap gedaan.";
  }
  if (checked && complete && wrongCount > 0) {
    return "Er zitten nog fouten in. Probeer het nog eens.";
  }
  if (checked && !complete) {
    return "Nog niet alle vakjes zijn gevuld.";
  }
  if (entry) {
    return `Nu: ${entry.number} ${entry.direction === "across" ? "horizontaal" : "verticaal"}.`;
  }
  return "Kies een vakje en typ een letter.";
}

export function CrosswordPlay() {
  useCrosswordKeyboard();

  const puzzle = useCrosswordStore((state) => state.puzzle);
  const letters = useCrosswordStore((state) => state.letters);
  const selected = useCrosswordStore((state) => state.selected);
  const entryIndex = useCrosswordStore((state) => state.entryIndex);
  const wrong = useCrosswordStore((state) => state.wrong);
  const hinted = useCrosswordStore((state) => state.hinted);
  const solved = useCrosswordStore((state) => state.solved);
  const checked = useCrosswordStore((state) => state.checked);

  const entry = entryIndex === null ? undefined : puzzle.entries[entryIndex];
  const total = puzzle.cells.flat().filter((cell) => cell.solution).length;
  const filled = Object.keys(letters).length;
  const status = statusText(solved, checked, filled >= total, wrong.size, entry);

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
      <div className="lg:col-span-1">
        <CrosswordGrid
          entry={entry}
          hinted={hinted}
          letters={letters}
          puzzle={puzzle}
          selected={selected}
          wrong={wrong}
          onSelect={(row, col) => useCrosswordStore.getState().selectCell(row, col)}
        />
      </div>

      <aside className="space-y-3 lg:col-span-1">
        {" "}
        <CrosswordClues
          entries={puzzle.entries}
          selectedIndex={entryIndex}
          onSelect={(index) => useCrosswordStore.getState().selectEntry(index)}
        />
        <CrosswordKeyboard
          disabled={solved}
          onBackspace={() => useCrosswordStore.getState().backspace()}
          onCheck={() => useCrosswordStore.getState().check()}
          onHint={() => useCrosswordStore.getState().hint()}
          onLetter={(letter) => useCrosswordStore.getState().typeLetter(letter)}
        />
        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {status}
        </p>
      </aside>
    </div>
  );
}
