import { useMemo } from "react";
import type { Cell, Puzzle } from "@entities/murdoku";
import {
  MURDOKU_CANDIDATE_COLOR,
  MurdokuBoard,
  candidateCells,
  crossedCells,
  type MurdokuPlayState,
} from "@features/murdoku-game";
import { Button, Undo2, X } from "@shared/ui";

interface MurdokuBoardSectionProps {
  puzzle: Puzzle;
  /** Werktitel van de zaak, voor het toegankelijke bordlabel. */
  title: string;
  play: MurdokuPlayState;
  /** Of er een stap is om ongedaan te maken. */
  canUndo: boolean;
  onCellTap: (cell: Cell) => void;
  onUndo: () => void;
  onToggleCross: () => void;
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

/**
 * Het bord met de rij- en kolomlabels, de twee bedieningsknoppen en de
 * hulpregel. De pagina hoeft alleen de zaak en de store-acties door te geven.
 */
export function MurdokuBoardSection({
  puzzle,
  title,
  play,
  canUndo,
  onCellTap,
  onUndo,
  onToggleCross,
}: MurdokuBoardSectionProps) {
  const crosses = useMemo(() => crossedCells(puzzle, play), [puzzle, play]);
  const candidates = useMemo(() => candidateCells(puzzle, play), [puzzle, play]);
  const status = statusText(puzzle, play);

  return (
    <section aria-labelledby="murdoku-plattegrond">
      <h2 className="sr-only" id="murdoku-plattegrond">
        De plattegrond
      </h2>
      <div className="game-panel p-3 sm:p-5">
        <div className="mx-auto w-full max-w-lg">
          <MurdokuBoard
            crosses={crosses}
            highlight={candidates}
            highlightColor={MURDOKU_CANDIDATE_COLOR}
            maxCellSize={120}
            mode={play.mode}
            placements={play.placements}
            puzzle={puzzle}
            selectedPerson={play.selected}
            title={title}
            onCellTap={onCellTap}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Button
          aria-pressed={play.mode === "cross"}
          className="min-h-11"
          variant={play.mode === "cross" ? "default" : "outline"}
          onClick={onToggleCross}
        >
          <X aria-hidden="true" className="size-5" />
          Kruisjesstand
        </Button>
        <Button className="min-h-11" disabled={!canUndo} variant="outline" onClick={onUndo}>
          <Undo2 aria-hidden="true" className="size-5" />
          Ongedaan maken
        </Button>
      </div>
      <p aria-live="polite" className="mt-2 text-center text-sm text-muted-foreground">
        {status}
      </p>
      <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
        Rijen staan links (R), kolommen boven (K). Tik nog eens op een geplaatst persoon om hem weg
        te halen.
      </p>
    </section>
  );
}
