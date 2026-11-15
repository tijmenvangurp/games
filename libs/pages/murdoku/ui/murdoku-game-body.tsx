import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import {
  MurdokuClueCards,
  MurdokuObjectLegend,
  type MurdokuPlayState,
  type MurdokuText,
} from "@features/murdoku-game";
import { Button, CelebrationDialog } from "@shared/ui";
import { MurdokuBoardSection } from "./murdoku-board-section";
import { feedbackFor } from "./murdoku-copy";
import { MurdokuReveal } from "./murdoku-reveal";

interface MurdokuGameBodyProps {
  puzzle: Puzzle;
  text: MurdokuText;
  play: MurdokuPlayState;
  title: string;
  intro: string;
  canCheck: boolean;
  historyLength: number;
  revealSentence: string | null;
  onCellTap: (cell: Cell) => void;
  onUndo: () => void;
  onToggleCross: () => void;
  onCheck: () => void;
  onRestart: () => void;
  onSelectPerson: (person: PersonId) => void;
  onHome: () => void;
}

interface MurdokuInfoSectionsProps {
  puzzle: Puzzle;
  text: MurdokuText;
  play: MurdokuPlayState;
  onSelectPerson: (person: PersonId) => void;
}

/** De kaarten met de aanwijzingen en de legenda onder het bord. */
function MurdokuInfoSections({ puzzle, text, play, onSelectPerson }: MurdokuInfoSectionsProps) {
  return (
    <>
      <section aria-labelledby="murdoku-personen" className="flex flex-col gap-2.5">
        <h2 className="font-display text-xl" id="murdoku-personen">
          Wie is wie?
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text.rule("aloneWithVictim")}
        </p>
        <MurdokuClueCards puzzle={puzzle} selectedId={play.selected} onSelect={onSelectPerson} />
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

/** Bord, kaarten, onthulling en viering van één zaak. */
export function MurdokuGameBody({
  puzzle,
  text,
  play,
  title,
  intro,
  canCheck,
  historyLength,
  revealSentence,
  onCellTap,
  onUndo,
  onToggleCross,
  onCheck,
  onRestart,
  onSelectPerson,
  onHome,
}: MurdokuGameBodyProps) {
  const [showCelebration, setShowCelebration] = useState(true);
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
          feedback={feedbackFor(play, revealSentence)}
          play={play}
          puzzle={puzzle}
          title={title}
          onCellTap={onCellTap}
          onCheck={onCheck}
          onToggleCross={onToggleCross}
          onUndo={onUndo}
        />

        {revealSentence ? <MurdokuReveal sentence={revealSentence} onRestart={restart} /> : null}

        <MurdokuInfoSections
          play={play}
          puzzle={puzzle}
          text={text}
          onSelectPerson={onSelectPerson}
        />
      </div>

      {revealSentence && showCelebration ? (
        <CelebrationDialog
          chooseLabel="Bekijk de plattegrond"
          confetti
          description={revealSentence}
          title="Opgelost!"
          onAgain={restart}
          onChoose={() => setShowCelebration(false)}
          onHome={onHome}
        />
      ) : null}
    </>
  );
}
