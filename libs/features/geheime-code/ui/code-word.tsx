import { symbolName, type CodeWordRow } from "@entities/geheime-code";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { SymbolTile } from "./code-token";
import { geheimeCodePlayTexts } from "./texts";

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
  const t = useTexts(geheimeCodePlayTexts);
  return (
    <div aria-label={t.word} className="flex justify-center gap-2 sm:gap-3" role="group">
      {row.cells.map((cell, index) => {
        const filled = entries[index] ?? "";
        const active = !wordDone && index === activeCell;
        const label = `${symbolName(cell.symbolId)}, ${filled ? t.letter(filled) : t.empty}`;

        return (
          <button
            key={`${cell.letter}-${index}`}
            aria-current={active ? "step" : undefined}
            aria-label={label}
            className="flex w-12 cursor-pointer flex-col items-center gap-1 rounded-xl sm:w-14"
            type="button"
            onClick={() => onSelect(index)}
          >
            <SymbolTile symbolId={cell.symbolId} />
            <span
              className={cn(
                "relative flex size-11 items-center justify-center rounded-xl border border-border bg-card font-display text-2xl transition sm:size-12",
                active && "border-primary ring-2 ring-primary/25",
                wrongCell === index && "border-warning bg-warning/10 code-shake",
              )}
            >
              {filled}
            </span>
          </button>
        );
      })}
    </div>
  );
}
