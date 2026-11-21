import { SYMBOL_BY_ID, type CodeWordRow } from "@entities/geheime-code";
import { cn } from "@shared/lib";
import { SymbolTile } from "./code-token";

interface CodeWordProps {
  row: CodeWordRow;
  entries: readonly string[];
  activeCell: number;
  wrongCell: number | null;
  wordDone: boolean;
  onSelect: (cell: number) => void;
}

export function CodeWord({
  row,
  entries,
  activeCell,
  wrongCell,
  wordDone,
  onSelect,
}: CodeWordProps) {
  return (
    <div aria-label="Woord" className="flex justify-center gap-2 sm:gap-3" role="group">
      {row.cells.map((cell, index) => {
        const symbol = SYMBOL_BY_ID[cell.symbolId];
        const filled = entries[index] ?? "";
        const active = !wordDone && index === activeCell;
        const label = `${symbol?.name ?? "symbool"}, ${
          filled ? `letter ${filled}` : "leeg"
        }${cell.given ? ", gegeven" : ""}`;

        return (
          <button
            key={`${cell.letter}-${index}`}
            aria-current={active ? "step" : undefined}
            aria-disabled={cell.given || undefined}
            aria-label={label}
            className={cn(
              "flex w-12 flex-col items-center gap-1 rounded-xl sm:w-14",
              cell.given ? "cursor-default" : "cursor-pointer",
            )}
            type="button"
            onClick={() => onSelect(index)}
          >
            <SymbolTile symbolId={cell.symbolId} />
            <span
              className={cn(
                "relative flex size-11 items-center justify-center rounded-xl border border-border bg-card font-display text-2xl transition sm:size-12",
                active && "border-primary ring-2 ring-primary/25",
                wrongCell === index && "border-warning bg-warning/10 code-shake",
                cell.given && "bg-muted",
              )}
            >
              {filled}
              {cell.given ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 size-2 rounded-full bg-primary"
                />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
