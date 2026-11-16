import { useMemo } from "react";
import type { Puzzle } from "@entities/murdoku";
import { cn } from "@shared/lib";
import { Check, X } from "@shared/ui";
import { MURDOKU_V1_LEGEND, murdokuLegend } from "../lib/legend";
import { MurdokuObjectIcon } from "./murdoku-object-icon";

interface MurdokuObjectLegendProps {
  /** De zaak waarvan de legenda uit het bord komt. Weglaten bij de uitleg. */
  puzzle?: Puzzle;
  /** De buit van de zaak; toont dezelfde uitleg als op de speelpagina. */
  lootName?: string;
  className?: string;
}

/**
 * De objectlegenda: op welke meubels mag een persoon staan en welke objecten
 * blokkeren een vakje? Zonder zaak toont hij de vaste legenda van de eerste
 * versie, zodat de uitleg dezelfde objecten laat zien als elke zaak.
 *
 * Een raam is geen vakje en staat daarom apart. De buit heeft een eigen icoon
 * en is geen meubel; hij staat daarom in een eigen regel.
 */
export function MurdokuObjectLegend({ puzzle, lootName, className }: MurdokuObjectLegendProps) {
  const legend = useMemo(() => (puzzle ? murdokuLegend(puzzle) : MURDOKU_V1_LEGEND), [puzzle]);
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
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm leading-snug",
                    group.occupiable ? "bg-success/10" : "bg-muted",
                  )}
                >
                  <MurdokuObjectIcon className="size-4" type={item.type} />
                  {item.name}
                </li>
              ))}
          </ul>
        </div>
      ))}
      <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
        Een raam is geen vakje: het zit op de muur.
        {lootName ? <> De buit ({lootName}) heeft een eigen icoon en is geen meubel.</> : null}
      </p>
    </div>
  );
}
