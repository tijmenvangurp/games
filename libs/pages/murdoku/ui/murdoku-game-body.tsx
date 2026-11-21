import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import {
  MurdokuClueCards,
  MurdokuObjectLegend,
  type MurdokuClueFocus,
  type MurdokuPlayState,
} from "@features/murdoku-game";
import { useTexts } from "@shared/i18n";
import { Button, CelebrationDialog } from "@shared/ui";
import { MurdokuBoardSection } from "./murdoku-board-section";
import { feedbackFor } from "./murdoku-copy";
import { MurdokuReveal } from "./murdoku-reveal";
import { MurdokuSettingsSection } from "./murdoku-settings";
import type { MurdokuCaseView, MurdokuHintView, MurdokuSettingsView } from "./murdoku-view";
import { MURDOKU_PAGE_TEXTS } from "./texts";

/** De acties van de pagina, gebundeld zodat de bedrading kort blijft. */
interface MurdokuGameActions {
  cellTap: (cell: Cell) => void;
  undo: () => void;
  toggleCross: () => void;
  check: () => void;
  restart: () => void;
  selectPerson: (person: PersonId) => void;
  /** Gaat naar de zaakkeuze en sluit de lopende ronde als die nog open is. */
  chooseCase: () => void;
  /** Opent de uitleg met de zes schermen en de woordenlijst. */
  help: () => void;
  home: () => void;
}

interface MurdokuGameBodyProps {
  /** De zaak: bord, tekstlaag, titel en intro. */
  caseView: MurdokuCaseView;
  play: MurdokuPlayState;
  settingsView: MurdokuSettingsView;
  canCheck: boolean;
  historyLength: number;
  revealSentence: string | null;
  /** De rustige uitleg over het niveau na een opgeloste zaak. */
  progressMessage: string | null;
  hintView: MurdokuHintView;
  actions: MurdokuGameActions;
}

interface MurdokuInfoSectionsProps {
  caseView: MurdokuCaseView;
  play: MurdokuPlayState;
  clueFocus: MurdokuClueFocus | null;
  /** De tweede parameter is `true` bij een toetsenbordactivering. */
  onSelectPerson: (person: PersonId, fromKeyboard: boolean) => void;
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
  const { puzzle, text, loot } = caseView;
  const t = useTexts(MURDOKU_PAGE_TEXTS).game;

  return (
    <>
      <section aria-labelledby="murdoku-personen" className="flex flex-col gap-2.5">
        <h2 className="font-display text-xl" id="murdoku-personen">
          {t.whoIsWho}
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
          {t.whereToStand}
        </h2>
        <MurdokuObjectLegend lootName={loot.name} puzzle={puzzle} />
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
  const t = useTexts(MURDOKU_PAGE_TEXTS).game;

  return (
    <CelebrationDialog
      chooseLabel={t.viewPlan}
      confetti
      description={sentence}
      title={t.solvedTitle}
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
  settingsView,
  canCheck,
  historyLength,
  revealSentence,
  progressMessage,
  hintView,
  actions,
}: MurdokuGameBodyProps) {
  const [showCelebration, setShowCelebration] = useState(true);
  const [boardFocusToken, setBoardFocusToken] = useState(0);
  const revealRef = useRef<HTMLElement>(null);
  const t = useTexts(MURDOKU_PAGE_TEXTS);
  const { puzzle, text, title, intro, loot } = caseView;
  const { settings, onAutoCross } = settingsView;
  const { hint, hintMessage, clueFocus, clueMessage, onHint, onFocusWord } = hintView;
  const restart = () => {
    setShowCelebration(true);
    actions.restart();
    setBoardFocusToken((token) => token + 1);
  };
  /** Een toetsenbordkeuze brengt de focus naar het bord; een tik laat hem staan. */
  const selectPerson = (person: PersonId, fromKeyboard: boolean) => {
    actions.selectPerson(person);
    if (fromKeyboard) setBoardFocusToken((token) => token + 1);
  };
  /** De viering wegklikken zet de focus op de onthulling, niet op de body. */
  const showBoard = () => {
    setShowCelebration(false);
    requestAnimationFrame(() => revealRef.current?.focus());
  };

  return (
    <>
      <div className="flex flex-col gap-3.5 pb-2">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">{intro}</p>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild className="min-h-11" size="sm" variant="outline">
              <Link to="/mysterie/zaken" onClick={actions.chooseCase}>
                {t.game.otherCase}
              </Link>
            </Button>
            <Button asChild className="min-h-11" size="sm" variant="outline">
              <Link to="/mysterie/les">{t.game.howItWorks}</Link>
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:landscape:grid lg:landscape:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:landscape:items-start lg:landscape:gap-6">
          <div className="min-w-0 lg:landscape:sticky lg:landscape:top-4 lg:landscape:self-start">
            <MurdokuBoardSection
              autoCross={settings.autoCross}
              canCheck={canCheck}
              canUndo={historyLength > 0}
              clueFocus={clueFocus}
              clueMessage={clueMessage}
              feedback={feedbackFor(play, revealSentence, t)}
              focusToken={boardFocusToken}
              hint={hint}
              hintMessage={hintMessage}
              lootIcon={loot.icon}
              play={play}
              puzzle={puzzle}
              title={title}
              actions={{
                cellTap: actions.cellTap,
                undo: actions.undo,
                reset: actions.restart,
                toggleCross: actions.toggleCross,
                check: actions.check,
                hint: onHint,
                help: actions.help,
              }}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-5 lg:landscape:max-h-[calc(100svh_-_9rem)] lg:landscape:overflow-y-auto lg:landscape:overscroll-contain lg:landscape:pr-1">
            {revealSentence ? (
              <MurdokuReveal
                ref={revealRef}
                progressMessage={progressMessage}
                sentence={revealSentence}
                onRestart={restart}
              />
            ) : null}
            <MurdokuInfoSections
              caseView={caseView}
              clueFocus={clueFocus}
              play={play}
              onFocusWord={onFocusWord}
              onSelectPerson={selectPerson}
            />
            <MurdokuSettingsSection settings={settings} onAutoCross={onAutoCross} />
          </div>
        </div>
      </div>

      {revealSentence && showCelebration ? (
        <MurdokuSolvedDialog
          sentence={revealSentence}
          onAgain={restart}
          onChoose={showBoard}
          onHome={actions.home}
        />
      ) : null}
    </>
  );
}
