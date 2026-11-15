import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { loadMurdokuLevel } from "@entities/murdoku";
import {
  MURDOKU_INTRO_LEVEL,
  MURDOKU_INTRO_SOLUTION,
  MurdokuClueCards,
  MurdokuObjectLegend,
  createMurdokuPlay,
  createMurdokuText,
  everyonePlaced,
  useMurdokuStore,
} from "@features/murdoku-game";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";
import { useShallow } from "zustand/react/shallow";
import { MurdokuBoardSection } from "./murdoku-board-section";
import { feedbackFor, revealSentenceFor } from "./murdoku-copy";
import { MurdokuReveal } from "./murdoku-reveal";

/**
 * Wie was het? — het instapscherm van de logicazaak.
 *
 * Het bord start leeg. Een kind kiest een persoon, tikt op een vakje om hem te
 * plaatsen en nog eens om hem weg te halen. De kruisjesstand streep vakjes weg,
 * auto-kruis doet de rij en kolom van een geplaatst persoon, en ongedaan maken
 * zet de vorige bordtoestand terug. Zodra iedereen staat, controleert het kind
 * de zaak; een goede controle onthult de dader en de kamer van het slachtoffer.
 */
export function MurdokuPage() {
  const navigate = useNavigate();
  const puzzle = useMemo(() => loadMurdokuLevel(MURDOKU_INTRO_LEVEL), []);
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);
  const {
    start,
    selectPerson,
    setMode,
    tapCell,
    undo,
    check,
    showHint,
    focusClue,
    storedPlay,
    historyLength,
    hint,
    clueFocus,
    clueFocusLabel,
  } = useMurdokuStore(
    useShallow((state) => ({
      start: state.start,
      selectPerson: state.selectPerson,
      setMode: state.setMode,
      tapCell: state.tapCell,
      undo: state.undo,
      check: state.check,
      showHint: state.showHint,
      focusClue: state.focusClue,
      storedPlay: state.play,
      historyLength: state.history.length,
      hint: state.hint,
      clueFocus: state.clueFocus,
      clueFocusLabel: state.clueFocusLabel,
    })),
  );
  const [showCelebration, setShowCelebration] = useState(true);
  const title = MURDOKU_INTRO_LEVEL.title ?? "de zaak";

  useEffect(() => {
    if (storedPlay?.levelId !== puzzle.id) {
      start(puzzle);
    }
  }, [puzzle, start, storedPlay?.levelId]);

  // De eerste render gebeurt vóór de start-effect; een leeg bord is dan het
  // juiste beeld en houdt de pagina zonder flikkering bruikbaar.
  const play = storedPlay?.levelId === puzzle.id ? storedPlay : createMurdokuPlay(puzzle.id);
  const toggleCross = () => setMode(play.mode === "cross" ? "place" : "cross");
  const canCheck = play.phase === "playing" && everyonePlaced(puzzle, play);
  const revealSentence = revealSentenceFor(puzzle, text, play);
  const hintMessage = hint ? text.explanation(hint.explanation) : null;
  const clueMessage = clueFocusLabel
    ? text.explanation({ key: "board.wordOn", params: { word: clueFocusLabel } })
    : null;

  /** Een nieuwe poging: leeg bord en de viering weer beschikbaar. */
  const restart = () => {
    setShowCelebration(true);
    start(puzzle);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      showSpeech={false}
      subtitle={`${title} · 4 × 4`}
      title="Wie was het?"
    >
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Er is iets gestolen. Lees de aanwijzingen, plaats iedereen en zoek wie als enige bij Vera
          was.
        </p>

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
          onCellTap={tapCell}
          onCheck={() => check(MURDOKU_INTRO_SOLUTION)}
          onHint={showHint}
          onToggleCross={toggleCross}
          onUndo={undo}
        />

        {revealSentence ? <MurdokuReveal sentence={revealSentence} onRestart={restart} /> : null}

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
            onFocusWord={focusClue}
            onSelect={selectPerson}
          />
        </section>

        <section aria-labelledby="murdoku-legenda" className="flex flex-col gap-2.5">
          <h2 className="font-display text-xl" id="murdoku-legenda">
            Waar mag je staan?
          </h2>
          <MurdokuObjectLegend puzzle={puzzle} />
        </section>
      </div>

      {revealSentence && showCelebration ? (
        <CelebrationDialog
          chooseLabel="Bekijk de plattegrond"
          confetti
          description={revealSentence}
          title="Opgelost!"
          onAgain={restart}
          onChoose={() => setShowCelebration(false)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
