import { cn } from "@shared/lib";
import type { Cell, PersonId } from "@entities/murdoku";
import type { MurdokuMode } from "../model/play";

interface LabelsProps {
  width: number;
  height: number;
  cell: number;
  labelSize: number;
}

/** De kolomlabels boven het bord (K1, K2, …). Puur visueel: de knoppen noemen
 * de rij en kolom al in hun toegankelijke naam. */
export function MurdokuColumnLabels({ width, cell, labelSize }: Omit<LabelsProps, "height">) {
  return (
    <div aria-hidden="true" className="flex">
      <span style={{ width: labelSize }} />
      <div
        className="grid text-center text-xs font-semibold text-muted-foreground"
        style={{ gridTemplateColumns: `repeat(${width}, ${cell}px)` }}
      >
        {Array.from({ length: width }, (_, col) => (
          <span key={col} className="pb-1">
            K{col + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

/** De rijlabels links van het bord (R1, R2, …). */
export function MurdokuRowLabels({ height, cell, labelSize }: Omit<LabelsProps, "width">) {
  return (
    <div
      aria-hidden="true"
      className="grid text-center text-xs font-semibold text-muted-foreground"
      style={{ width: labelSize, gridTemplateRows: `repeat(${height}, ${cell}px)` }}
    >
      {Array.from({ length: height }, (_, row) => (
        <span key={row} className="flex items-center justify-start">
          R{row + 1}
        </span>
      ))}
    </div>
  );
}

interface CellGridProps {
  labels: readonly string[];
  width: number;
  height: number;
  mode: MurdokuMode;
  selectedPerson: PersonId | null;
  onCellTap?: (cell: Cell) => void;
}

/** Transparant knoppenrooster over het canvas: één echte knop per vakje. */
export function MurdokuCellGrid({
  labels,
  width,
  height,
  mode,
  selectedPerson,
  onCellTap,
}: CellGridProps) {
  return (
    <div
      aria-label="Vakjes van de plattegrond"
      className="absolute inset-0 z-10 grid"
      role="group"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
    >
      {labels.map((label, index) => (
        <button
          key={index}
          aria-label={label}
          className={cn(
            "min-h-11 min-w-11 touch-manipulation rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-inset",
            onCellTap && "transition-colors hover:bg-primary/5",
          )}
          data-mode={mode}
          data-selected={selectedPerson ?? undefined}
          type="button"
          onClick={onCellTap ? () => onCellTap(index) : undefined}
        />
      ))}
    </div>
  );
}
