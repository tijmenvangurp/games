import { Eraser } from "@shared/ui";

const LETTERS = [..."abcdefghijklmnopqrstuvwxyz"] as const;

interface AlphabetKeyboardProps {
  onLetter: (letter: string) => void;
  onClear: () => void;
}

export function AlphabetKeyboard({ onLetter, onClear }: AlphabetKeyboardProps) {
  return (
    <div
      aria-label="Kies een letter"
      className="grid grid-cols-7 gap-1.5 sm:grid-cols-9"
      role="group"
    >
      {LETTERS.map((letter) => (
        <button
          key={letter}
          aria-label={letter.toUpperCase()}
          className="h-11 rounded-lg border border-border bg-card text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          type="button"
          onClick={() => onLetter(letter)}
        >
          {letter.toUpperCase()}
        </button>
      ))}
      <button
        aria-label="Wissen"
        className="flex h-11 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
        type="button"
        onClick={onClear}
      >
        <Eraser aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
