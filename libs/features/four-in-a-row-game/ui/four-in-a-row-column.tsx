import type { Cell, Player } from "@entities/four-in-a-row";
import { FourInARowDisc } from "./four-in-a-row-disc";

interface FourInARowColumnProps {
  /** Nulgebaseerd kolomnummer op het bord. */
  index: number;
  /** De vakjes van onder naar boven. */
  cells: readonly Cell[];
  /** Wie er nu mag; bepaalt de kleur van de voorbeeldige schijf. */
  ghost: Player;
  /** De rij waar de voorbeeldige schijf zou landen, of `null`. */
  previewRow: number | null;
  /** De vakjes van de winnende rij, als "kolom:rij". */
  winning: ReadonlySet<string>;
  /** De schijf die net gevallen is, als "kolom:rij". */
  latest: string | null;
  disabled: boolean;
  onDrop: (column: number) => void;
  onHover: (column: number | null) => void;
}

export function FourInARowColumn({
  index,
  cells,
  ghost,
  previewRow,
  winning,
  latest,
  disabled,
  onDrop,
  onHover,
}: FourInARowColumnProps) {
  return (
    <button
      type="button"
      aria-label={`Kolom ${index + 1}`}
      className="flex flex-1 flex-col-reverse gap-0.5 rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:gap-1"
      disabled={disabled}
      onBlur={() => onHover(null)}
      onClick={() => onDrop(index)}
      onFocus={() => onHover(index)}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={() => onHover(null)}
    >
      {cells.map((cell, row) => (
        <FourInARowDisc
          key={row}
          ghost={row === previewRow ? ghost : null}
          highlighted={winning.has(`${index}:${row}`)}
          latest={latest === `${index}:${row}`}
          player={cell}
        />
      ))}
    </button>
  );
}
