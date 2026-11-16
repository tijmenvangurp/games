import { Check, X } from "@shared/ui";
import { cn } from "@shared/lib";
import type { MurdokuDiagramCell, MurdokuDiagramSpec } from "../lib/lesson";
import { suspectColor } from "../lib/palette";
import { MurdokuObjectIcon } from "./murdoku-object-icon";

/** De kleur van een vakje bij zijn betekenis in het diagram. */
function toneClass(cell: MurdokuDiagramCell): string {
  switch (cell.tone) {
    case "ok":
      return "bg-success/10";
    case "no":
      return "bg-danger/10";
    case "area":
      return "bg-primary/10";
    case "highlight":
      return "bg-warning/15 ring-2 ring-inset ring-warning";
    default:
      return cell.room === "b" ? "bg-muted" : cell.room === "lit" ? "bg-primary/10" : "bg-card";
  }
}

/** Een persoon als gekleurde pion met zijn letter. */
function PersonDot({ letter }: { letter: string }) {
  const color = suspectColor(letter.charCodeAt(0) - 65);

  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white ring-2 ring-card"
      style={{ backgroundColor: color }}
    >
      {letter}
    </span>
  );
}

/** De buit als lokaal elementicoon, zonder externe afbeelding. */
function LootBadge({ icon }: { icon: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className="size-8 shrink-0 drop-shadow-sm"
      src={`/elements/${icon}.svg`}
    />
  );
}

/** Een object als icoon met zijn Nederlandse naam eronder. */
function ObjectBadge({ type, name }: { type: string; name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex min-w-0 flex-col items-center gap-0.5 text-muted-foreground"
    >
      <MurdokuObjectIcon className="size-5" type={type} />
      <span className="max-w-full truncate text-[9px] font-semibold leading-none">{name}</span>
    </span>
  );
}

interface MurdokuDiagramProps {
  diagram: MurdokuDiagramSpec;
  /** De Nederlandse naam van een objecttype, voor het label onder het icoon. */
  objectName?: (type: string) => string;
  /** De grootte van één vakje in rem; het diagram groeit mee met het aantal kolommen. */
  maxCell?: number;
  className?: string;
}

/**
 * Een klein schema bij één regel uit de uitleg of de woordenlijst.
 *
 * De diagrammen zijn echte tekst en echte vlakken, geen canvas: ze schalen mee
 * op 390 px en 1024 px en een schermlezer leest de beschrijving voor. Kleur is
 * nooit de enige drager: een vinkje, een kruis of de letter zegt het ook.
 */
export function MurdokuDiagram({
  diagram,
  objectName = (type) => type,
  maxCell = 3.5,
  className,
}: MurdokuDiagramProps) {
  const columns = Math.max(...diagram.rows.map((row) => row.length));

  return (
    <div
      aria-label={diagram.label}
      className={cn(
        "grid w-full gap-px overflow-hidden rounded-lg border-2 border-border bg-border",
        className,
      )}
      role="img"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        // Nooit breder dan een vast vakje, zodat een smal diagram geen
        // uitgerekte vakjes krijgt en een breed diagram toch past.
        maxWidth: `${columns * maxCell}rem`,
      }}
    >
      {diagram.rows.flatMap((row, rowIndex) =>
        row.map((cell, columnIndex) => (
          <div
            key={`${rowIndex}-${columnIndex}`}
            className={cn(
              "relative grid aspect-square min-h-11 place-items-center p-1",
              toneClass(cell),
              cell.wallRight && "border-r-4 border-r-foreground",
              cell.wallBottom && "border-b-4 border-b-foreground",
            )}
          >
            {cell.windowTop ? (
              <span className="absolute inset-x-1 top-1 h-1 rounded-full bg-pawn-blue" />
            ) : null}
            {cell.person ? <PersonDot letter={cell.person} /> : null}
            {cell.loot ? <LootBadge icon={cell.loot} /> : null}
            {cell.object ? <ObjectBadge name={objectName(cell.object)} type={cell.object} /> : null}
            {cell.mark === "check" ? (
              <Check aria-hidden="true" className="absolute right-1 top-1 size-3.5 text-success" />
            ) : null}
            {cell.mark === "cross" ? (
              <X aria-hidden="true" className="absolute right-1 top-1 size-3.5 text-danger" />
            ) : null}
          </div>
        )),
      )}
    </div>
  );
}
