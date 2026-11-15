import { useMemo, type RefObject } from "react";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import { cn } from "@shared/lib";
import type { MurdokuMode } from "../model/play";
import { createMurdokuText } from "../lib/text";
import type { HelpMarks } from "../lib/vendored/helpMarks";
import { MurdokuCellGrid, MurdokuColumnLabels, MurdokuRowLabels } from "./murdoku-board-parts";
import { useBoardCellSize, LABEL_SIZE } from "./use-board-cell-size";
import { useMurdokuCanvas } from "./use-murdoku-canvas";

/** De onthulling na een goede controle: de dader en het slachtoffer. */
interface MurdokuBoardReveal {
  murdererId: PersonId;
  victimCell: Cell;
}

interface MurdokuBoardProps {
  puzzle: Puzzle;
  /** Werktitel van de zaak; gebruikt voor het toegankelijke label. */
  title: string;
  /** Geplaatste personen. Zonder plaatsingen toont het bord alleen de plattegrond. */
  placements?: ReadonlyMap<PersonId, Cell>;
  /** Kandidaatvakjes van de gekozen persoon (primaire hintwash). */
  highlight?: ReadonlySet<Cell> | null;
  highlightColor?: { wash: string; ring: string };
  /** Weggekruiste vakjes. */
  crosses?: ReadonlySet<Cell>;
  /** Rustige referentiemarkeringen van de aanwijzingen (kameromtrek, objectring). */
  helpMarks?: HelpMarks | null;
  /** Omlijnt één kamer, bijvoorbeeld de kamer van het slachtoffer bij de afloop. */
  outlineRoomId?: string | null;
  /** De onthulling: de dader krijgt een ring en het slachtoffer staat op het bord. */
  reveal?: MurdokuBoardReveal | null;
  /** De gekozen persoon, voor de toegankelijke vakjeslabels. */
  selectedPerson?: PersonId | null;
  /** De tikstand; bepaalt of een tik plaatst of wegstreept. */
  mode?: MurdokuMode;
  /** Eén tik op een vakje. Zonder handler is het bord alleen een weergave. */
  onCellTap?: (cell: Cell) => void;
  /** Maximale grootte van één vakje in CSS-px (tablet). */
  maxCellSize?: number;
  className?: string;
}

const NO_CELLS: ReadonlySet<Cell> = new Set();
const NO_PLACEMENTS: ReadonlyMap<PersonId, Cell> = new Map();

function cellLabel(
  puzzle: Puzzle,
  text: ReturnType<typeof createMurdokuText>,
  placements: ReadonlyMap<PersonId, Cell>,
  crosses: ReadonlySet<Cell>,
  cell: Cell,
): string {
  const { board } = puzzle;
  const { row, col } = board.rc(cell);
  const occupiable = board.isOccupiable(cell);
  const person = [...placements].find(([, placed]) => placed === cell)?.[0] ?? null;
  const tile = board.tileAt(cell);
  const room = board.rooms.get(board.roomIdOf(cell));
  const objects = tile.objects().map((object) => text.objectName(object.type));
  const state = person
    ? puzzle.nameOf(person)
    : !occupiable
      ? "geen plek"
      : crosses.has(cell)
        ? "kruisje"
        : "leeg";

  return [
    state,
    !occupiable && "hier mag niemand staan",
    `rij ${row + 1}`,
    `kolom ${col + 1}`,
    room ? text.roomName(room.nameKey) : null,
    objects.length > 0 ? objects.join(" en ") : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

/** De toegankelijke naam van elk vakje, in bordvolgorde. */
function boardLabels(
  puzzle: Puzzle,
  text: ReturnType<typeof createMurdokuText>,
  placed: ReadonlyMap<PersonId, Cell>,
  crosses: ReadonlySet<Cell>,
): string[] {
  const total = puzzle.board.width * puzzle.board.height;
  return Array.from({ length: total }, (_, cell) => cellLabel(puzzle, text, placed, crosses, cell));
}

interface BoardGridProps {
  title: string;
  width: number;
  height: number;
  cell: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  labels: readonly string[];
  mode: MurdokuMode;
  selectedPerson: PersonId | null;
  onCellTap?: (cell: Cell) => void;
}

/** Het canvas met het transparante knoppenrooster eroverheen. */
function BoardGrid({
  title,
  width,
  height,
  cell,
  canvasRef,
  labels,
  mode,
  selectedPerson,
  onCellTap,
}: BoardGridProps) {
  return (
    <div className="relative" style={{ width: width * cell, height: height * cell }}>
      <canvas
        ref={canvasRef}
        aria-label={`Plattegrond van ${title}, ${width} bij ${height}`}
        className="block rounded-sm"
        role="img"
      />
      <MurdokuCellGrid
        height={height}
        labels={labels}
        mode={mode}
        onCellTap={onCellTap}
        selectedPerson={selectedPerson}
        width={width}
      />
    </div>
  );
}

/**
 * Eén canvas met de plattegrond van een zaak: kamers, vloeren, meubels, ramen,
 * kamernamen en de geplaatste portretten. Boven en links staan de kolom- en
 * rijlabels; over het canvas ligt een transparant knoppenrooster met per vakje
 * een Nederlandse toegankelijke naam. Zo blijven de pixels snel en is de
 * bediening echt met rollen en namen te testen.
 */
export function MurdokuBoard({
  puzzle,
  title,
  placements,
  highlight = null,
  highlightColor,
  crosses = NO_CELLS,
  helpMarks = null,
  outlineRoomId = null,
  reveal = null,
  selectedPerson = null,
  mode = "place",
  onCellTap,
  maxCellSize = 128,
  className,
}: MurdokuBoardProps) {
  const width = puzzle.board.width;
  const height = puzzle.board.height;
  const { wrapRef, cell } = useBoardCellSize(width, maxCellSize);
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);
  const placed = placements ?? NO_PLACEMENTS;
  const labels = useMemo(
    () => boardLabels(puzzle, text, placed, crosses),
    [puzzle, text, placed, crosses],
  );
  const canvasRef = useMurdokuCanvas({
    puzzle,
    cell,
    text,
    placed,
    crosses,
    highlight,
    highlightColor,
    helpMarks,
    outlineRoomId,
    reveal,
  });

  return (
    <div ref={wrapRef} className={cn("flex w-full flex-col items-center", className)}>
      <div className="mx-auto" style={{ width: LABEL_SIZE + width * cell }}>
        <MurdokuColumnLabels cell={cell} labelSize={LABEL_SIZE} width={width} />
        <div className="flex">
          <MurdokuRowLabels cell={cell} height={height} labelSize={LABEL_SIZE} />
          <BoardGrid
            canvasRef={canvasRef}
            cell={cell}
            height={height}
            labels={labels}
            mode={mode}
            selectedPerson={selectedPerson}
            title={title}
            width={width}
            onCellTap={onCellTap}
          />
        </div>
      </div>
    </div>
  );
}
