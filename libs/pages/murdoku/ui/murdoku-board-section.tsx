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
import { Button, Check, CircleQuestionMark, Lightbulb, RotateCcw, Undo2, X } from "@shared/ui";

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
  /** De hint als leesbare Nederlandse zin. */
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
  puzzle: Puzzle,
  play: MurdokuPlayState,
  feedback: string | null,
  hintMessage: string | null,
  clueMessage: string | null,
): string {
  return feedback ?? hintMessage ?? clueMessage ?? statusText(puzzle, play);
}

function statusText(puzzle: Puzzle, play: MurdokuPlayState): string {
  if (play.mode === "cross") {
    return "Kruisjesstand: tik op een vrij vakje om het weg te strepen.";
  }
  if (play.selected) {
    const name = puzzle.nameOf(play.selected);
    const cell = play.placements.get(play.selected);
    if (cell !== undefined) {
      const { row, col } = puzzle.board.rc(cell);
      return `${name} staat op rij ${row + 1}, kolom ${col + 1}. Tik op een ander vakje om te verplaatsen, of op dit vakje om weg te halen.`;
    }
    return `${name} is gekozen. Tik op een vakje om te plaatsen.`;
  }
  return "Kies eerst een persoon hieronder.";
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
        Kruisjesstand
      </Button>
      <Button className="min-h-11" disabled={!canUndo || solved} variant="outline" onClick={onUndo}>
        <Undo2 aria-hidden="true" className="size-5" />
        Ongedaan maken
      </Button>
      <Button className="min-h-11" disabled={solved} variant="outline" onClick={onReset}>
        <RotateCcw aria-hidden="true" className="size-5" />
        Opnieuw beginnen
      </Button>
      <Button className="min-h-11" disabled={solved} variant="outline" onClick={onHint}>
        <Lightbulb aria-hidden="true" className="size-5" />
        Aanwijzing
      </Button>
      <Button className="min-h-11" disabled={!canCheck} onClick={onCheck}>
        <Check aria-hidden="true" className="size-5" />
        Controleer
      </Button>
      {onHelp ? (
        <Button
          aria-label="Uitleg en woordenlijst"
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
  return (
    <>
      {!canCheck && !solved ? (
        <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
          Controleren kan zodra iedereen op het bord staat.
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
        Rijen staan links (R), kolommen boven (K). Tik nog eens op een geplaatst persoon om hem weg
        te halen.
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
    <div className="game-panel p-3 sm:p-5">
      <div className="mx-auto w-full max-w-lg">
        <MurdokuBoard
          crosses={crosses}
          focus={focus}
          focusToken={focusToken}
          helpMarks={helpMarks}
          highlight={highlight}
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
    </div>
  );
}

/**
 * Het bord met de rij- en kolomlabels, de bedieningsknoppen en de hulpregel.
 * De pagina hoeft alleen de zaak en de store-acties door te geven. Na een goede
 * controle omlijnt het bord de kamer van het slachtoffer en krijgt de dader een
 * ring; het bord staat dan vast.
 *
 * Een hint licht eerst de rij, kolom of kamer op en past daarna één stap toe;
 * een tik op een woord in een aanwijzing licht het genoemde ding op. Beide
 * gebruiken dezelfde rustige markering en laten de gewone bordkleuren staan.
 */
export function MurdokuBoardSection({
  puzzle,
  title,
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
  const sectionRef = useRef<HTMLElement>(null);
  const previousHint = useRef(hint);
  const wordView = useMemo(() => focusView(puzzle, clueFocus), [puzzle, clueFocus]);
  const solved = play.phase === "solved";
  const status = boardStatus(puzzle, play, feedback, hintMessage, clueMessage);

  // Een nieuwe hint zet de focus op het eerste vakje dat hij aanwijst, zodat een
  // toetsenbordgebruiker direct op het bord staat. De uitleg leest de
  // schermlezer voor via de statusregel; een herstelde hint bij het openen van
  // de pagina steelt geen focus.
  useEffect(() => {
    if (previousHint.current === hint) return;
    previousHint.current = hint;
    const target = hint?.cells[0];
    if (target === undefined) return;
    sectionRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${target}"]`)?.focus();
  }, [hint]);

  return (
    <section ref={sectionRef} aria-labelledby="murdoku-plattegrond">
      <h2 className="sr-only" id="murdoku-plattegrond">
        De plattegrond
      </h2>
      <MurdokuBoardPanel
        autoCross={autoCross}
        focus={focusFor(hint, clueFocus, wordView.cells)}
        focusToken={focusToken}
        helpMarks={clueFocus ? wordView.marks : null}
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
