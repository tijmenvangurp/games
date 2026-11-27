import { type ReactNode, type RefObject, useEffect, useState } from "react";
import { VICTIM_ID, type Cell, type PersonId, type Puzzle } from "@entities/murdoku";
import { useTexts } from "@shared/i18n";
import type { MurdokuMode } from "../model/play";
import { MURDOKU_HINT_COLOR } from "../lib/palette";
import type { MurdokuText } from "../lib/text";
import { useMurdokuText } from "./use-murdoku-text";
import type { HelpMarks } from "../lib/vendored/helpMarks";
import { MurdokuCellGrid, MurdokuColumnLabels, MurdokuRowLabels } from "./murdoku-board-parts";
import { useBoardCellSize, LABEL_SIZE } from "./use-board-cell-size";
import { useMurdokuCanvas } from "./use-murdoku-canvas";
import { MURDOKU_UI_TEXTS } from "./texts";

/** De vaste woorden van het bord in de gekozen taal. */
type BoardTexts = (typeof MURDOKU_UI_TEXTS)["nl"]["board"];

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
  /** Elementnaam van de buit; het bord laadt het lokale icoon zelf. */
  lootIcon?: string;
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
  t: BoardTexts,
  person: PersonId | null,
  occupiable: boolean,
  crossed: boolean,
): string {
  if (person !== null) return puzzle.nameOf(person);
  if (!occupiable) return t.blocked;
  return crossed ? t.crossed : t.empty;
}

/** Wat een tik op dit vakje nu doet, in de taal van het kind. */
function cellAction(
  t: BoardTexts,
  person: PersonId | null,
  selectedPerson: PersonId | null,
  occupiable: boolean,
  mode: MurdokuMode,
  selectedName: string | null,
): string | null {
  if (!occupiable) return null;
  if (person !== null) return person === selectedPerson ? t.tapToRemove : null;
  if (mode === "cross") return t.tapToCross;
  return selectedName === null ? null : t.canStandHere(selectedName);
}

function cellLabel(
  puzzle: Puzzle,
  text: MurdokuText,
  t: BoardTexts,
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
    cellState(puzzle, t, person, occupiable, crosses.has(cell)),
    focus?.has(cell) === true && t.lit,
    !occupiable && t.nobodyHere,
    t.row(row + 1),
    t.col(col + 1),
    room ? text.roomName(room.nameKey) : null,
    objects.length > 0 ? objects.join(t.objectsJoin) : null,
    cellAction(t, person, selectedPerson, occupiable, mode, selectedName),
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

/** De toegankelijke naam van elk vakje, in bordvolgorde. */
function boardLabels(
  puzzle: Puzzle,
  text: MurdokuText,
  t: BoardTexts,
  placed: ReadonlyMap<PersonId, Cell>,
  crosses: ReadonlySet<Cell>,
  focus: ReadonlySet<Cell> | null,
  selectedPerson: PersonId | null,
  mode: MurdokuMode,
): string[] {
  const total = puzzle.board.width * puzzle.board.height;
  return Array.from({ length: total }, (_, cell) =>
    cellLabel(puzzle, text, t, placed, crosses, focus, cell, selectedPerson, mode),
  );
}

/**
 * Eén regel per persoon: waar hij staat, of dat hij nog niet op het bord staat.
 * Dit is de tekstlaag van de overlay, zodat een schermlezer niet voor elk vakje
 * hoeft te horen wie waar staat. Het slachtoffer komt er pas bij de afloop bij.
 */
function placementSummary(
  puzzle: Puzzle,
  t: BoardTexts,
  placements: ReadonlyMap<PersonId, Cell>,
): string[] {
  const people = [
    ...puzzle.suspects.map((suspect) => suspect.id),
    ...(placements.has(VICTIM_ID) ? [VICTIM_ID] : []),
  ];
  return people.map((person) => {
    const name = puzzle.nameOf(person);
    const cell = placements.get(person);
    if (cell === undefined) return t.notPlaced(name);
    const { row, col } = puzzle.board.rc(cell);
    return t.placedAt(name, row + 1, col + 1);
  });
}

/** De per-persoon samenvatting onder de vakjes; visueel verborgen. */
function MurdokuPersonSummary({ lines, label }: { lines: readonly string[]; label: string }) {
  return (
    <ul aria-label={label} className="sr-only">
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
  t: BoardTexts;
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
  t,
}: BoardGridProps) {
  return (
    <div className="relative" style={{ width: width * cell, height: height * cell }}>
      <canvas
        ref={canvasRef}
        aria-label={t.label(title, width, height)}
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
      <MurdokuPersonSummary label={t.summary} lines={summary} />
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
 * Laadt het lokale elementicoon van de buit. Geen netwerk buiten de app: het
 * bestand komt uit `apps/games/public/elements/` en wordt door Vite geserveerd.
 * Zolang het laadt, tekent het bord een neutrale schijf zonder schedel.
 */
function useLootImage(lootIcon: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!lootIcon) {
      setImage(null);
      return;
    }
    const next = new Image();
    let active = true;
    next.onload = () => {
      if (active) setImage(next);
    };
    next.src = `/elements/${lootIcon}.svg`;
    return () => {
      active = false;
      next.onload = null;
    };
  }, [lootIcon]);

  return image;
}

/**
 * Eén canvas met de plattegrond van een zaak: kamers, vloeren, meubels, ramen,
 * kamernamen en de geplaatste portretten. Boven en links staan de kolom- en
 * rijlabels; over het canvas ligt een transparant knoppenrooster met per vakje
 * een toegankelijke naam in de gekozen taal. Zo blijven de pixels snel en is de
 * bediening echt met rollen en namen te testen.
 */
// Een React-scherm met veel props, default-waarden en vier hooks; de
// conditionele bedrading is lineair en wordt door de bord- en e2e-tests gedekt.
// fallow-ignore-next-line complexity
export function MurdokuBoard({
  puzzle,
  title,
  lootIcon,
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
  const { wrapRef, cell } = useBoardCellSize(width, height, MAX_BOARD_CELL, {
    fitLandscapeHeight: true,
  });
  const text = useMurdokuText(puzzle);
  const t = useTexts(MURDOKU_UI_TEXTS).board;
  const lootImage = useLootImage(lootIcon);
  const placed = placements ?? NO_PLACEMENTS;
  const labels = boardLabels(
    puzzle,
    text,
    t,
    placed,
    crosses,
    focus?.cells ?? null,
    selectedPerson,
    mode,
  );
  const summary = placementSummary(puzzle, t, placed);
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
    lootIcon: lootImage,
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
        t={t}
        title={title}
        width={width}
        onCellTap={onCellTap}
      />
    </BoardFrame>
  );
}
