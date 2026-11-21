import { useEffect, useMemo, useRef } from "react";
import type { Cell, Puzzle } from "@entities/murdoku";
import {
  MURDOKU_CANDIDATE_COLOR,
  MurdokuBoard,
  candidateCells,
  crossedCells,
  focusView,
  type MurdokuClueFocus,
  type MurdokuBoardHighlight,
  type MurdokuHintState,
  type MurdokuPlayState,
} from "@features/murdoku-game";
import {
  Button,
  Check,
  CircleQuestionMark,
  Lightbulb,
  Panel,
  RotateCcw,
  Undo2,
  X,
} from "@shared/ui";
import { useTexts } from "@shared/i18n";
import { MURDOKU_PAGE_TEXTS } from "./texts";

/** De bordteksten van de pagina in één taal. */
type BoardTexts = (typeof MURDOKU_PAGE_TEXTS)["nl"]["board"];

/** De knoppen en tikacties van het bord, gebundeld zodat de sectie leesbaar blijft. */
interface MurdokuBoardActions {
  cellTap: (cell: Cell) => void;
  undo: () => void;
  reset: () => void;
  toggleCross: () => void;
  check: () => void;
  hint: () => void;
  /** Weglaten verbergt de ?-knop naar de uitleg en de woordenlijst. */
  help?: () => void;
}

interface MurdokuBoardSectionProps {
  puzzle: Puzzle;
  /** Werktitel van de zaak, voor het toegankelijke bordlabel. */
  title: string;
  /** Elementnaam van de buit, bijvoorbeeld "cake"; het bord laadt die lokaal. */
  lootIcon: string;
  play: MurdokuPlayState;
  /** Of de rij en kolom van een geplaatst persoon automatisch een kruisje krijgen. */
  autoCross?: boolean;
  /** Of er een stap is om ongedaan te maken. */
  canUndo: boolean;
  /** Of de controle nu mag: iedereen staat en de zaak loopt nog. */
  canCheck: boolean;
  /** Melding onder het bord; `null` toont de gewone hulpregel. */
  feedback: string | null;
  /** De hint die nu op het bord staat. */
  hint?: MurdokuHintState | null;
  /** De hint als leesbare zin in de gekozen taal. */
  hintMessage?: string | null;
  /** Het woord uit een aanwijzing dat op het bord oplicht. */
  clueFocus?: MurdokuClueFocus | null;
  /** Melding bij dat woord, bijvoorbeeld "De keuken licht op." */
  clueMessage?: string | null;
  /** Elke ophoging vraagt de focus: na een toetsenbordkeuze of een nieuw spel. */
  focusToken?: number;
  actions: MurdokuBoardActions;
}

/** De regel onder het bord: feedback gaat vóór de hint, het woord en de hulpregel. */
function boardStatus(
  t: BoardTexts,
  puzzle: Puzzle,
  play: MurdokuPlayState,
  feedback: string | null,
  hintMessage: string | null,
  clueMessage: string | null,
): string {
  return feedback ?? hintMessage ?? clueMessage ?? statusText(t, puzzle, play);
}

function statusText(t: BoardTexts, puzzle: Puzzle, play: MurdokuPlayState): string {
  if (play.mode === "cross") {
    return t.crossMode;
  }
  if (play.selected) {
    const name = puzzle.nameOf(play.selected);
    const cell = play.placements.get(play.selected);
    if (cell !== undefined) {
      const { row, col } = puzzle.board.rc(cell);
      return t.placed(name, row + 1, col + 1);
    }
    return t.chosen(name);
  }
  return t.choose;
}

interface MurdokuControlsProps {
  mode: MurdokuPlayState["mode"];
  solved: boolean;
  canUndo: boolean;
  canCheck: boolean;
  onToggleCross: () => void;
  onUndo: () => void;
  onReset: () => void;
  onCheck: () => void;
  onHint: () => void;
  onHelp?: () => void;
}

/** De knoppen onder het bord, met de ? voor de uitleg. */
function MurdokuControls({
  mode,
  solved,
  canUndo,
  canCheck,
  onToggleCross,
  onUndo,
  onReset,
  onCheck,
  onHint,
  onHelp,
}: MurdokuControlsProps) {
  const t = useTexts(MURDOKU_PAGE_TEXTS).board;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      <Button
        aria-pressed={mode === "cross"}
        className="min-h-11"
        disabled={solved}
        variant={mode === "cross" ? "default" : "outline"}
        onClick={onToggleCross}
      >
        <X aria-hidden="true" className="size-5" />
        {t.cross}
      </Button>
      <Button className="min-h-11" disabled={!canUndo || solved} variant="outline" onClick={onUndo}>
        <Undo2 aria-hidden="true" className="size-5" />
        {t.undo}
      </Button>
      <Button className="min-h-11" disabled={solved} variant="outline" onClick={onReset}>
        <RotateCcw aria-hidden="true" className="size-5" />
        {t.restart}
      </Button>
      <Button className="min-h-11" disabled={solved} variant="outline" onClick={onHint}>
        <Lightbulb aria-hidden="true" className="size-5" />
        {t.hint}
      </Button>
      <Button className="min-h-11" disabled={!canCheck} onClick={onCheck}>
        <Check aria-hidden="true" className="size-5" />
        {t.check}
      </Button>
      {onHelp ? (
        <Button
          aria-label={t.help}
          className="min-h-11"
          size="icon"
          variant="outline"
          onClick={onHelp}
        >
          <CircleQuestionMark aria-hidden="true" className="size-5" />
        </Button>
      ) : null}
    </div>
  );
}

/** De hintmelding, de hulpregel en de uitleg onder het bord. */
function MurdokuStatus({
  status,
  canCheck,
  solved,
}: {
  status: string;
  canCheck: boolean;
  solved: boolean;
}) {
  const t = useTexts(MURDOKU_PAGE_TEXTS).board;

  return (
    <>
      {!canCheck && !solved ? (
        <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
          {t.checkLater}
        </p>
      ) : null}
      <p
        aria-atomic="true"
        aria-live="polite"
        className="mt-2 text-center text-sm text-muted-foreground"
        role="status"
      >
        {status}
      </p>
      <p
        className="mt-1 text-center text-xs leading-relaxed text-muted-foreground"
        id="murdoku-bordhulp"
      >
        {t.boardHelp}
      </p>
    </>
  );
}

/** Welke vakjes oplichten: de hint gaat vóór de markering van een woord. */
function focusFor(
  hint: MurdokuHintState | null,
  clueFocus: MurdokuClueFocus | null,
  wordCells: Set<Cell>,
): MurdokuBoardHighlight | null {
  if (hint && hint.cells.length > 0) return { cells: new Set(hint.cells) };
  return clueFocus ? { cells: wordCells } : null;
}

interface MurdokuBoardPanelProps {
  puzzle: Puzzle;
  title: string;
  lootIcon: string;
  play: MurdokuPlayState;
  autoCross: boolean;
  focus: MurdokuBoardHighlight | null;
  helpMarks: ReturnType<typeof focusView>["marks"] | null;
  focusToken: number;
  onCellTap: (cell: Cell) => void;
}

/** Het paneel met het canvas, de kruisjes, de kandidaten en de onthulling. */
function MurdokuBoardPanel({
  puzzle,
  title,
  lootIcon,
  play,
  autoCross,
  focus,
  helpMarks,
  focusToken,
  onCellTap,
}: MurdokuBoardPanelProps) {
  const crosses = useMemo(
    () => crossedCells(puzzle, play, { autoCross }),
    [puzzle, play, autoCross],
  );
  const candidates = useMemo(() => candidateCells(puzzle, play), [puzzle, play]);
  const highlight = useMemo(
    () => (candidates ? { cells: candidates, color: MURDOKU_CANDIDATE_COLOR } : null),
    [candidates],
  );
  const resolution = play.resolution;
  const reveal = useMemo(
    () =>
      resolution ? { murdererId: resolution.murdererId, victimCell: resolution.victimCell } : null,
    [resolution],
  );

  return (
    <Panel className="p-3 sm:p-5" padding="none">
      <div className="mx-auto w-full max-w-lg lg:landscape:max-w-none">
        <MurdokuBoard
          crosses={crosses}
          focus={focus}
          focusToken={focusToken}
          helpMarks={helpMarks}
          highlight={highlight}
          lootIcon={lootIcon}
          mode={play.mode}
          outlineRoomId={resolution?.roomId ?? null}
          placements={play.placements}
          puzzle={puzzle}
          reveal={reveal}
          selectedPerson={play.selected}
          title={title}
          onCellTap={onCellTap}
        />
      </div>
    </Panel>
  );
}

/** De rustige ringen bij een clue-nudge; een tik op een woord werkt hetzelfde. */
function hintMarks(
  hint: MurdokuHintState | null,
  hintView: ReturnType<typeof focusView> | null,
  clueFocus: MurdokuClueFocus | null,
  wordView: ReturnType<typeof focusView>,
): ReturnType<typeof focusView>["marks"] | null {
  if (hint?.stage === "clue") return hintView?.marks ?? null;
  return clueFocus ? wordView.marks : null;
}

/**
 * Een nieuwe hint zet de focus op het eerste vakje dat hij aanwijst, zodat een
 * toetsenbordgebruiker direct op het bord staat. De uitleg leest de
 * schermlezer voor via de statusregel; een herstelde hint bij het openen van
 * de pagina steelt geen focus.
 */
function useHintFocus(hint: MurdokuHintState | null) {
  const sectionRef = useRef<HTMLElement>(null);
  const previousHint = useRef(hint);

  useEffect(() => {
    if (previousHint.current === hint) return;
    previousHint.current = hint;
    const target = hint?.cells[0];
    if (target === undefined) return;
    sectionRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${target}"]`)?.focus();
  }, [hint]);

  return sectionRef;
}

/**
 * Het bord met de rij- en kolomlabels, de bedieningsknoppen en de hulpregel.
 * De pagina hoeft alleen de zaak en de store-acties door te geven. Na een goede
 * controle omlijnt het bord de kamer van de buit en krijgt de dief een ring; het
 * bord staat dan vast.
 *
 * Een hint licht eerst de aanwijzing van een persoon op, daarna de exacte plek
 * met de reden en pas dan de gedwongen zet. Een tik op een woord in een
 * aanwijzing licht het genoemde ding op. Beide gebruiken dezelfde rustige
 * markering en laten de gewone bordkleuren staan.
 */
export function MurdokuBoardSection({
  puzzle,
  title,
  lootIcon,
  play,
  autoCross = true,
  canUndo,
  canCheck,
  feedback,
  hint = null,
  hintMessage = null,
  clueFocus = null,
  clueMessage = null,
  focusToken = 0,
  actions,
}: MurdokuBoardSectionProps) {
  const t = useTexts(MURDOKU_PAGE_TEXTS).board;
  const sectionRef = useHintFocus(hint);
  const wordView = useMemo(
    () => focusView(puzzle, clueFocus, play.placements),
    [puzzle, clueFocus, play.placements],
  );
  const hintView = useMemo(
    () => (hint?.focus ? focusView(puzzle, hint.focus, play.placements) : null),
    [puzzle, hint, play.placements],
  );
  const solved = play.phase === "solved";
  const status = boardStatus(t, puzzle, play, feedback, hintMessage, clueMessage);

  return (
    <section ref={sectionRef} aria-labelledby="murdoku-plattegrond">
      <h2 className="sr-only" id="murdoku-plattegrond">
        {t.heading}
      </h2>
      <MurdokuBoardPanel
        autoCross={autoCross}
        focus={focusFor(hint, clueFocus, wordView.cells)}
        focusToken={focusToken}
        helpMarks={hintMarks(hint, hintView, clueFocus, wordView)}
        lootIcon={lootIcon}
        play={play}
        puzzle={puzzle}
        title={title}
        onCellTap={actions.cellTap}
      />
      <MurdokuControls
        canCheck={canCheck}
        canUndo={canUndo}
        mode={play.mode}
        solved={solved}
        onCheck={actions.check}
        onHelp={actions.help}
        onHint={actions.hint}
        onReset={actions.reset}
        onToggleCross={actions.toggleCross}
        onUndo={actions.undo}
      />
      <MurdokuStatus canCheck={canCheck} solved={solved} status={status} />
    </section>
  );
}
