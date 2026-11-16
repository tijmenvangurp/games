import { useMemo, type ReactNode, type RefObject } from "react";
import { VICTIM_ID, type Cell, type PersonId, type Puzzle } from "@entities/murdoku";
import type { MurdokuMode } from "../model/play";
import { MURDOKU_HINT_COLOR } from "../lib/palette";
import type { MurdokuText } from "../lib/text";
import { useMurdokuText } from "./use-murdoku-text";
import type { HelpMarks } from "../lib/vendored/helpMarks";
import { MurdokuCellGrid, MurdokuColumnLabels, MurdokuRowLabels } from "./murdoku-board-parts";
import { useBoardCellSize, LABEL_SIZE } from "./use-board-cell-size";
import { useMurdokuCanvas } from "./use-murdoku-canvas";

/** De onthulling na een goede controle: de dader en het slachtoffer. */
interface MurdokuBoardReveal {
  murdererId: PersonId;
  victimCell: Cell;
}

/** Een laag vakjes die oplicht, met een eigen wash- en ringkleur. */
export interface MurdokuBoardHighlight {
  cells: ReadonlySet<Cell>;
  color?: { wash: string; ring: string };
}

interface MurdokuBoardProps {
  puzzle: Puzzle;
  /** Werktitel van de zaak; gebruikt voor het toegankelijke label. */
  title: string;
  /** Geplaatste personen. Zonder plaatsingen toont het bord alleen de plattegrond. */
  placements?: ReadonlyMap<PersonId, Cell>;
  /** Kandidaatvakjes van de gekozen persoon (primaire hintwash). */
  highlight?: MurdokuBoardHighlight | null;
  /** Vakjes die bij een hint of een tik op een woord oplichten (hintkleur). */
  focus?: MurdokuBoardHighlight | null;
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
  /** Elke ophoging vraagt de focus: na een toetsenbordkeuze of een nieuwe hint. */
  focusToken?: number;
}

const NO_CELLS: ReadonlySet<Cell> = new Set();
const NO_PLACEMENTS: ReadonlyMap<PersonId, Cell> = new Map();
/** Groter dan dit wordt een vakje ook op een tablet niet: het bord blijft leesbaar. */
const MAX_BOARD_CELL = 120;

/**
 * Welke vakjes met welke kleur opgelicht worden. Een hint of een tik op een
 * woord gaat vóór de kandidaatwash van de gekozen persoon: het bord toont één
 * uitleg tegelijk.
 */
function drawnHighlight(
  focus: MurdokuBoardHighlight | null,
  highlight: MurdokuBoardHighlight | null,
): { cells: ReadonlySet<Cell> | null; color: { wash: string; ring: string } | undefined } {
  if (focus) return { cells: focus.cells, color: focus.color ?? MURDOKU_HINT_COLOR };
  if (highlight) return { cells: highlight.cells, color: highlight.color };
  return { cells: null, color: undefined };
}

/** De toestand van een vakje in één woord: wie staat er, of juist niets. */
function cellState(
  puzzle: Puzzle,
  person: PersonId | null,
  occupiable: boolean,
  crossed: boolean,
): string {
  if (person !== null) return puzzle.nameOf(person);
  if (!occupiable) return "geen plek";
  return crossed ? "kruisje" : "leeg";
}

/** Wat een tik op dit vakje nu doet, in de taal van het kind. */
function cellAction(
  person: PersonId | null,
  selectedPerson: PersonId | null,
  occupiable: boolean,
  mode: MurdokuMode,
  selectedName: string | null,
): string | null {
  if (!occupiable) return null;
  if (person !== null) return person === selectedPerson ? "tik om weg te halen" : null;
  if (mode === "cross") return "tik om weg te strepen";
  return selectedName === null ? null : `${selectedName} kan hier staan`;
}

function cellLabel(
  puzzle: Puzzle,
  text: MurdokuText,
  placements: ReadonlyMap<PersonId, Cell>,
  crosses: ReadonlySet<Cell>,
  focus: ReadonlySet<Cell> | null,
  cell: Cell,
  selectedPerson: PersonId | null,
  mode: MurdokuMode,
): string {
  const { board } = puzzle;
  const { row, col } = board.rc(cell);
  const occupiable = board.isOccupiable(cell);
  const person = [...placements].find(([, placed]) => placed === cell)?.[0] ?? null;
  const tile = board.tileAt(cell);
  const room = board.rooms.get(board.roomIdOf(cell));
  const objects = tile.objects().map((object) => text.objectName(object.type));
  const selectedName = selectedPerson === null ? null : puzzle.nameOf(selectedPerson);

  return [
    cellState(puzzle, person, occupiable, crosses.has(cell)),
    focus?.has(cell) === true && "licht op",
    !occupiable && "hier mag niemand staan",
    `rij ${row + 1}`,
    `kolom ${col + 1}`,
    room ? text.roomName(room.nameKey) : null,
    objects.length > 0 ? objects.join(" en ") : null,
    cellAction(person, selectedPerson, occupiable, mode, selectedName),
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

/** De toegankelijke naam van elk vakje, in bordvolgorde. */
function boardLabels(
  puzzle: Puzzle,
  text: MurdokuText,
  placed: ReadonlyMap<PersonId, Cell>,
  crosses: ReadonlySet<Cell>,
  focus: ReadonlySet<Cell> | null,
  selectedPerson: PersonId | null,
  mode: MurdokuMode,
): string[] {
  const total = puzzle.board.width * puzzle.board.height;
  return Array.from({ length: total }, (_, cell) =>
    cellLabel(puzzle, text, placed, crosses, focus, cell, selectedPerson, mode),
  );
}

/**
 * Eén regel per persoon: waar hij staat, of dat hij nog niet op het bord staat.
 * Dit is de tekstlaag van de overlay, zodat een schermlezer niet voor elk vakje
 * hoeft te horen wie waar staat. Het slachtoffer komt er pas bij de afloop bij.
 */
function placementSummary(puzzle: Puzzle, placements: ReadonlyMap<PersonId, Cell>): string[] {
  const people = [
    ...puzzle.suspects.map((suspect) => suspect.id),
    ...(placements.has(VICTIM_ID) ? [VICTIM_ID] : []),
  ];
  return people.map((person) => {
    const name = puzzle.nameOf(person);
    const cell = placements.get(person);
    if (cell === undefined) return `${name} staat nog niet op het bord.`;
    const { row, col } = puzzle.board.rc(cell);
    return `${name} staat op rij ${row + 1}, kolom ${col + 1}.`;
  });
}

/** De per-persoon samenvatting onder de vakjes; visueel verborgen. */
function MurdokuPersonSummary({ lines }: { lines: readonly string[] }) {
  return (
    <ul aria-label="Waar staat wie?" className="sr-only">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

interface BoardGridProps {
  title: string;
  width: number;
  height: number;
  cell: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  labels: readonly string[];
  summary: readonly string[];
  mode: MurdokuMode;
  selectedPerson: PersonId | null;
  focusToken?: number;
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
  summary,
  mode,
  selectedPerson,
  focusToken,
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
        focusToken={focusToken}
        height={height}
        labels={labels}
        mode={mode}
        onCellTap={onCellTap}
        selectedPerson={selectedPerson}
        width={width}
      />
      <MurdokuPersonSummary lines={summary} />
    </div>
  );
}

interface BoardFrameProps {
  wrapRef: RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  cell: number;
  children: ReactNode;
}

/** De kolomlabels, rijlabels en het bord binnen veilige vaste maten. */
function BoardFrame({ wrapRef, width, height, cell, children }: BoardFrameProps) {
  return (
    <div ref={wrapRef} className="flex w-full flex-col items-center">
      <div className="mx-auto" style={{ width: LABEL_SIZE + width * cell }}>
        <MurdokuColumnLabels cell={cell} labelSize={LABEL_SIZE} width={width} />
        <div className="flex">
          <MurdokuRowLabels cell={cell} height={height} labelSize={LABEL_SIZE} />
          {children}
        </div>
      </div>
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
  focus = null,
  crosses = NO_CELLS,
  helpMarks = null,
  outlineRoomId = null,
  reveal = null,
  selectedPerson = null,
  mode = "place",
  onCellTap,
  focusToken = 0,
}: MurdokuBoardProps) {
  const width = puzzle.board.width;
  const height = puzzle.board.height;
  const { wrapRef, cell } = useBoardCellSize(width, MAX_BOARD_CELL);
  const text = useMurdokuText(puzzle);
  const placed = placements ?? NO_PLACEMENTS;
  const labels = boardLabels(
    puzzle,
    text,
    placed,
    crosses,
    focus?.cells ?? null,
    selectedPerson,
    mode,
  );
  const summary = placementSummary(puzzle, placed);
  const drawn = drawnHighlight(focus, highlight);
  const canvasRef = useMurdokuCanvas({
    puzzle,
    cell,
    text,
    placed,
    crosses,
    highlight: drawn.cells,
    highlightColor: drawn.color,
    helpMarks,
    outlineRoomId,
    reveal,
  });

  return (
    <BoardFrame cell={cell} height={height} width={width} wrapRef={wrapRef}>
      <BoardGrid
        canvasRef={canvasRef}
        cell={cell}
        focusToken={focusToken}
        height={height}
        labels={labels}
        mode={mode}
        selectedPerson={selectedPerson}
        summary={summary}
        title={title}
        width={width}
        onCellTap={onCellTap}
      />
    </BoardFrame>
  );
}
