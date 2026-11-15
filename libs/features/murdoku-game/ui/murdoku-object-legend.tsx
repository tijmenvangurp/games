import { useMemo } from "react";
import type { Puzzle } from "@entities/murdoku";
import { cn } from "@shared/lib";
import { Check, X } from "@shared/ui";
import { murdokuLegend } from "../lib/legend";
import { createMurdokuText } from "../lib/text";

interface MurdokuObjectLegendProps {
  puzzle: Puzzle;
  className?: string;
}

/**
 * De objectlegenda: op welke meubels mag een persoon staan en welke objecten
 * blokkeren een vakje? Een raam is geen vakje en staat daarom apart.
 */
export function MurdokuObjectLegend({ puzzle, className }: MurdokuObjectLegendProps) {
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);
  const legend = useMemo(() => murdokuLegend(puzzle), [puzzle]);
  const groups = [
    { occupiable: true, label: "Hier mag je staan" },
    { occupiable: false, label: "Hier mag je niet staan" },
  ] as const;

  return (
    <div className={cn("game-panel grid grid-cols-1 gap-4 p-4 sm:grid-cols-2", className)}>
      {groups.map((group) => (
        <div key={group.label} className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            {group.occupiable ? (
              <Check aria-hidden="true" className="size-4 shrink-0 text-success" />
            ) : (
              <X aria-hidden="true" className="size-4 shrink-0 text-danger" />
            )}
            {group.label}
          </h3>
          <ul aria-label={group.label} className="mt-2 flex flex-wrap gap-1.5">
            {legend
              .filter((item) => item.occupiable === group.occupiable)
              .map((item) => (
                <li
                  key={item.type}
                  className="rounded-md bg-muted px-2.5 py-1 text-sm leading-snug"
                >
                  {text.objectName(item.type)}
                </li>
              ))}
          </ul>
        </div>
      ))}
      <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
        Een raam is geen vakje: het zit op de muur.
      </p>
    </div>
  );
}
