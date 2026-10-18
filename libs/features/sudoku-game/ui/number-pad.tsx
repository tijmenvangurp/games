import type { SudokuSize } from "@entities/sudoku";
import { cn } from "@shared/lib";

interface NumberPadProps {
  size: SudokuSize;
  symbols: readonly string[];
  activeValue?: number | null;
  remaining?: readonly number[];
  disabled?: boolean;
  onPick: (value: number) => void;
}

const PAD_COLUMNS: Record<SudokuSize, number> = {
  4: 4,
  6: 3,
  9: 3,
};

export function NumberPad({
  size,
  symbols,
  activeValue = null,
  remaining,
  disabled,
  onPick,
}: NumberPadProps) {
  return (
    <div
      aria-label="Kies een getal of dier"
      className="grid gap-2"
      role="group"
      style={{ gridTemplateColumns: `repeat(${PAD_COLUMNS[size]}, minmax(0, 1fr))` }}
    >
      {symbols.map((symbol, index) => {
        const value = index + 1;
        const left = remaining?.[value];
        const isCompleted = left !== undefined && left <= 0;
        return (
          <button
            key={value}
            type="button"
            aria-label={`Kies ${symbol}`}
            aria-pressed={activeValue === value}
            className={cn(
              "relative flex aspect-square w-full max-w-20 select-none items-center justify-center justify-self-center rounded-2xl border-2 border-white bg-white font-bold text-slate-700 shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-50",
              size === 4 ? "text-3xl" : "text-2xl",
              activeValue === value && "border-sky-300 bg-sky-100 text-sky-700",
            )}
            disabled={disabled || isCompleted}
            onClick={() => onPick(value)}
          >
            {symbol}
            {left !== undefined ? (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1 text-xs font-semibold leading-none text-slate-400"
              >
                {Math.max(0, left)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
