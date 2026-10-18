import { Button, Check, Eraser, Lightbulb } from "@shared/ui";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface CrosswordKeyboardProps {
  disabled: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onCheck: () => void;
  onHint: () => void;
}

export function CrosswordKeyboard({
  disabled,
  onLetter,
  onBackspace,
  onCheck,
  onHint,
}: CrosswordKeyboardProps) {
  return (
    <div className="space-y-2 rounded-3xl border bg-card p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={disabled} variant="outline" onClick={onCheck}>
          <Check aria-hidden="true" className="size-4 text-emerald-600" />
          Controleer
        </Button>
        <Button disabled={disabled} variant="outline" onClick={onHint}>
          <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
          Hint
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Lettertoetsen">
        {LETTERS.map((letter) => (
          <button
            key={letter}
            aria-label={`Letter ${letter}`}
            className="min-h-11 rounded-lg border border-border bg-card text-sm font-black transition active:scale-95 hover:bg-muted disabled:opacity-50"
            disabled={disabled}
            type="button"
            onClick={() => onLetter(letter)}
          >
            {letter}
          </button>
        ))}
        <button
          aria-label="Wis letter"
          className="col-span-2 min-h-11 rounded-lg border border-border bg-card text-sm font-bold transition active:scale-95 hover:bg-muted disabled:opacity-50"
          disabled={disabled}
          type="button"
          onClick={onBackspace}
        >
          <Eraser aria-hidden="true" className="mx-auto size-4" />
        </button>
      </div>
    </div>
  );
}
