import { useRef } from "react";
import type { Cell, Player } from "@entities/four-in-a-row";
import { useTexts } from "@shared/i18n";
import { fourInARowTexts } from "../model/texts";
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
  // Een tik op een aanraakscherm kan de knop ook focus geven; dan tonen we
  // geen hint, want op touch bestaat hover niet.
  const touched = useRef(false);
  const t = useTexts(fourInARowTexts);

  return (
    <button
      type="button"
      aria-label={t.column(index + 1)}
      className="four-in-a-row-column flex flex-1 flex-col-reverse gap-0.5 rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:gap-1"
      disabled={disabled}
      onBlur={() => onHover(null)}
      onClick={() => onDrop(index)}
      onFocus={() => {
        if (!touched.current) {
          onHover(index);
        }
      }}
      onKeyDown={() => {
        touched.current = false;
      }}
      onPointerDown={(event) => {
        touched.current = event.pointerType === "touch";
      }}
      onPointerEnter={(event) => {
        // Op een aanraakscherm bestaat hover niet: daar zou de hint alleen
        // heel even flitsen vlak voor het muntje valt.
        if (event.pointerType !== "touch") {
          onHover(index);
        }
      }}
      onPointerLeave={() => onHover(null)}
    >
      {cells.map((cell, row) => (
        <FourInARowDisc
          key={row}
          dropRows={cells.length - row}
          ghost={row === previewRow ? ghost : null}
          highlighted={winning.has(`${index}:${row}`)}
          latest={latest === `${index}:${row}`}
          player={cell}
        />
      ))}
    </button>
  );
}
