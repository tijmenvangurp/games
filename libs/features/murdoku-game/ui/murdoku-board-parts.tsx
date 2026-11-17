import { useEffect, useRef } from "react";
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
  /** Elke ophoging vraagt de focus: na een toetsenbordkeuze of een nieuwe hint. */
  focusToken?: number;
  onCellTap?: (cell: Cell) => void;
}

/**
 * Transparant knoppenrooster over het canvas: één echte knop per vakje, per rij
 * gegroepeerd zodat een schermlezer "Rij 2" aankondigt voordat de vakjes komen.
 * De groep zelf is met `tabIndex={-1}` programmeerbaar focusbaar; daarna leiden
 * Tab en Shift+Tab langs de vakjes.
 */
export function MurdokuCellGrid({
  labels,
  width,
  height,
  mode,
  selectedPerson,
  focusToken = 0,
  onCellTap,
}: CellGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusToken === 0) return;
    gridRef.current?.focus();
  }, [focusToken]);

  const rows = Array.from({ length: height }, (_, row) =>
    labels.slice(row * width, (row + 1) * width),
  );

  return (
    <div
      ref={gridRef}
      aria-describedby="murdoku-bordhulp"
      aria-label="Vakjes van de plattegrond"
      className="absolute inset-0 z-10 flex flex-col focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-inset focus-visible:outline-none"
      data-board-grid="true"
      role="group"
      tabIndex={-1}
    >
      {rows.map((rowLabels, row) => (
        <div key={row} aria-label={`Rij ${row + 1}`} className="flex min-h-0 flex-1" role="group">
          {rowLabels.map((label, col) => {
            const index = row * width + col;
            return (
              <button
                key={index}
                aria-label={label}
                className={cn(
                  "min-h-11 min-w-11 flex-1 touch-manipulation rounded-sm focus-visible:z-20 focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-inset focus-visible:outline-none",
                  onCellTap && "transition-colors hover:bg-primary/5",
                )}
                data-cell={index}
                data-mode={mode}
                data-selected={selectedPerson ?? undefined}
                type="button"
                onClick={onCellTap ? () => onCellTap(index) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
