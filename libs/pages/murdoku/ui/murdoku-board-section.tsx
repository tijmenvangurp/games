import { useMemo } from "react";
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
import { Button, Check, CircleQuestionMark, Lightbulb, Undo2, X } from "@shared/ui";

interface MurdokuBoardSectionProps {
  puzzle: Puzzle;
  /** Werktitel van de zaak, voor het toegankelijke bordlabel. */
  title: string;
  play: MurdokuPlayState;
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
  /** Opent de uitleg en de woordenlijst; weglaten verbergt de ?-knop. */
  onHelp?: () => void;
  onCellTap: (cell: Cell) => void;
  onUndo: () => void;
  onToggleCross: () => void;
  onCheck: () => void;
  onHint: () => void;
}

function statusText(puzzle: Puzzle, play: MurdokuPlayState): string {
  if (play.mode === "cross") {
    return "Kruisjesstand: tik op een vrij vakje om het weg te strepen.";
  }
  if (play.selected) {
    return `${puzzle.nameOf(play.selected)} is gekozen. Tik op een vakje om te plaatsen.`;
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
        aria-live="polite"
        className="mt-2 text-center text-sm text-muted-foreground"
        role="status"
      >
        {status}
      </p>
      <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
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
  focus: MurdokuBoardHighlight | null;
  helpMarks: ReturnType<typeof focusView>["marks"] | null;
  onCellTap: (cell: Cell) => void;
}

/** Het paneel met het canvas, de kruisjes, de kandidaten en de onthulling. */
function MurdokuBoardPanel({
  puzzle,
  title,
  play,
  focus,
  helpMarks,
  onCellTap,
}: MurdokuBoardPanelProps) {
  const crosses = useMemo(() => crossedCells(puzzle, play), [puzzle, play]);
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
          helpMarks={helpMarks}
          highlight={highlight}
          maxCellSize={120}
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
  canUndo,
  canCheck,
  feedback,
  hint = null,
  hintMessage = null,
  clueFocus = null,
  clueMessage = null,
  onHelp,
  onCellTap,
  onUndo,
  onToggleCross,
  onCheck,
  onHint,
}: MurdokuBoardSectionProps) {
  const wordView = useMemo(() => focusView(puzzle, clueFocus), [puzzle, clueFocus]);
  const solved = play.phase === "solved";
  const status = feedback ?? hintMessage ?? clueMessage ?? statusText(puzzle, play);

  return (
    <section aria-labelledby="murdoku-plattegrond">
      <h2 className="sr-only" id="murdoku-plattegrond">
        De plattegrond
      </h2>
      <MurdokuBoardPanel
        focus={focusFor(hint, clueFocus, wordView.cells)}
        helpMarks={clueFocus ? wordView.marks : null}
        play={play}
        puzzle={puzzle}
        title={title}
        onCellTap={onCellTap}
      />
      <MurdokuControls
        canCheck={canCheck}
        canUndo={canUndo}
        mode={play.mode}
        solved={solved}
        onCheck={onCheck}
        onHelp={onHelp}
        onHint={onHint}
        onToggleCross={onToggleCross}
        onUndo={onUndo}
      />
      <MurdokuStatus canCheck={canCheck} solved={solved} status={status} />
    </section>
  );
}
