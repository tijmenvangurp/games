import { useTexts } from "@shared/i18n";
import { Eraser } from "@shared/ui";
import { geheimeCodePlayTexts } from "./texts";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;

interface AlphabetKeyboardProps {
  onLetter: (letter: string) => void;
  onClear: () => void;
}

export function AlphabetKeyboard({ onLetter, onClear }: AlphabetKeyboardProps) {
  const t = useTexts(geheimeCodePlayTexts);
  return (
    <div aria-label={t.chooseLetter} className="flex flex-col gap-0.5 sm:gap-1.5" role="group">
      {ROWS.map((row, rowIndex) => (
        <div key={row} className="grid grid-cols-10 gap-0.5 sm:gap-1.5">
          {rowIndex > 0 ? <span aria-hidden="true" /> : null}
          {[...row].map((letter) => (
            <button
              key={letter}
              aria-label={letter.toUpperCase()}
              className="h-11 min-w-0 rounded-lg border border-border bg-card text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:h-12"
              type="button"
              onClick={() => onLetter(letter)}
            >
              {letter.toUpperCase()}
            </button>
          ))}
          {rowIndex === 2 ? (
            <button
              aria-label={t.erase}
              className="col-span-2 flex h-11 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:h-12"
              type="button"
              onClick={onClear}
            >
              <Eraser aria-hidden="true" className="size-5" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
