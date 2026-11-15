import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import {
  MurdokuClueCards,
  MurdokuObjectLegend,
  type MurdokuClueFocus,
  type MurdokuPlayState,
} from "@features/murdoku-game";
import { Button, CelebrationDialog } from "@shared/ui";
import { MurdokuBoardSection } from "./murdoku-board-section";
import { feedbackFor } from "./murdoku-copy";
import { MurdokuReveal } from "./murdoku-reveal";
import type { MurdokuCaseView, MurdokuHintView } from "./murdoku-view";

interface MurdokuGameBodyProps {
  /** De zaak: bord, tekstlaag, titel en intro. */
  caseView: MurdokuCaseView;
  play: MurdokuPlayState;
  canCheck: boolean;
  historyLength: number;
  revealSentence: string | null;
  hintView: MurdokuHintView;
  onCellTap: (cell: Cell) => void;
  onUndo: () => void;
  onToggleCross: () => void;
  onCheck: () => void;
  onRestart: () => void;
  onSelectPerson: (person: PersonId) => void;
  onHome: () => void;
}

interface MurdokuInfoSectionsProps {
  caseView: MurdokuCaseView;
  play: MurdokuPlayState;
  clueFocus: MurdokuClueFocus | null;
  onSelectPerson: (person: PersonId) => void;
  onFocusWord: (focus: MurdokuClueFocus, label: string) => void;
}

/** De kaarten met de aanwijzingen en de legenda onder het bord. */
function MurdokuInfoSections({
  caseView,
  play,
  clueFocus,
  onSelectPerson,
  onFocusWord,
}: MurdokuInfoSectionsProps) {
  const { puzzle, text } = caseView;

  return (
    <>
      <section aria-labelledby="murdoku-personen" className="flex flex-col gap-2.5">
        <h2 className="font-display text-xl" id="murdoku-personen">
          Wie is wie?
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text.rule("aloneWithVictim")}
        </p>
        <MurdokuClueCards
          activeWord={clueFocus}
          puzzle={puzzle}
          selectedId={play.selected}
          onFocusWord={onFocusWord}
          onSelect={onSelectPerson}
        />
      </section>

      <section aria-labelledby="murdoku-legenda" className="flex flex-col gap-2.5">
        <h2 className="font-display text-xl" id="murdoku-legenda">
          Waar mag je staan?
        </h2>
        <MurdokuObjectLegend puzzle={puzzle} />
      </section>
    </>
  );
}

/** De viering na een opgeloste zaak. */
function MurdokuSolvedDialog({
  sentence,
  onAgain,
  onChoose,
  onHome,
}: {
  sentence: string;
  onAgain: () => void;
  onChoose: () => void;
  onHome: () => void;
}) {
  return (
    <CelebrationDialog
      chooseLabel="Bekijk de plattegrond"
      confetti
      description={sentence}
      title="Opgelost!"
      onAgain={onAgain}
      onChoose={onChoose}
      onHome={onHome}
    />
  );
}

/** Bord, kaarten, onthulling en viering van één zaak. */
export function MurdokuGameBody({
  caseView,
  play,
  canCheck,
  historyLength,
  revealSentence,
  hintView,
  onCellTap,
  onUndo,
  onToggleCross,
  onCheck,
  onRestart,
  onSelectPerson,
  onHome,
}: MurdokuGameBodyProps) {
  const [showCelebration, setShowCelebration] = useState(true);
  const { puzzle, text, title, intro } = caseView;
  const { hint, hintMessage, clueFocus, clueMessage, onHint, onFocusWord } = hintView;
  const restart = () => {
    setShowCelebration(true);
    onRestart();
  };

  return (
    <>
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{intro}</p>
        <Button asChild className="min-h-11 self-start" variant="outline">
          <Link to="/mysterie/zaken">Kies een andere zaak</Link>
        </Button>

        <MurdokuBoardSection
          canCheck={canCheck}
          canUndo={historyLength > 0}
          clueFocus={clueFocus}
          clueMessage={clueMessage}
          feedback={feedbackFor(play, revealSentence)}
          hint={hint}
          hintMessage={hintMessage}
          play={play}
          puzzle={puzzle}
          title={title}
          onCellTap={onCellTap}
          onCheck={onCheck}
          onHint={onHint}
          onToggleCross={onToggleCross}
          onUndo={onUndo}
        />

        {revealSentence ? <MurdokuReveal sentence={revealSentence} onRestart={restart} /> : null}

        <MurdokuInfoSections
          caseView={caseView}
          clueFocus={clueFocus}
          play={play}
          onFocusWord={onFocusWord}
          onSelectPerson={onSelectPerson}
        />
      </div>

      {revealSentence && showCelebration ? (
        <MurdokuSolvedDialog
          sentence={revealSentence}
          onAgain={restart}
          onChoose={() => setShowCelebration(false)}
          onHome={onHome}
        />
      ) : null}
    </>
  );
}
