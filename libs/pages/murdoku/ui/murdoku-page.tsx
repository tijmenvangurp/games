import { useEffect, useLayoutEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createMurdokuPlay, everyonePlaced, useMurdokuStore } from "@features/murdoku-game";
import { useLanguage, useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { useShallow } from "zustand/react/shallow";
import { revealSentenceFor, progressSentenceFor } from "./murdoku-copy";
import { MurdokuGameBody } from "./murdoku-game-body";
import { MURDOKU_PAGE_TEXTS } from "./texts";
import { useMurdokuSession } from "./use-murdoku-session";

/**
 * Wie was het? — het speelscherm van de logicazaak.
 *
 * Het bord start leeg. Een kind kiest een persoon, tikt op een vakje om hem te
 * plaatsen en nog eens om hem weg te halen. De kruisjesstand streep vakjes weg,
 * auto-kruis doet de rij en kolom van een geplaatst persoon, en ongedaan maken
 * zet de vorige bordtoestand terug. Zodra iedereen staat, controleert het kind
 * de zaak; een goede controle onthult de dief en de kamer van de buit.
 * Een hint licht eerst de aanwijzing van een persoon op en daarna de reden en
 * de gedwongen zet.
 */
export function MurdokuPage() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = useTexts(MURDOKU_PAGE_TEXTS);

  useLayoutEffect(() => {
    useMurdokuStore.setState({ clueFocus: null, clueFocusLabel: null });
  }, [language]);
  const {
    start,
    selectPerson,
    setMode,
    tapCell,
    undo,
    check,
    showHint,
    focusClue,
    setAutoCross,
    abandon,
    settings,
    storedPlay,
    historyLength,
    hint,
    clueFocus,
    clueFocusLabel,
    lastRound,
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
      setAutoCross: state.setAutoCross,
      abandon: state.abandon,
      settings: state.settings,
      storedPlay: state.play,
      historyLength: state.history.length,
      hint: state.hint,
      clueFocus: state.clueFocus,
      clueFocusLabel: state.clueFocusLabel,
      lastRound: state.lastRound,
    })),
  );
  const { puzzle, text, solution, title, intro, loot } = useMurdokuSession(storedPlay);

  useEffect(() => {
    if (storedPlay?.levelId !== puzzle.id) {
      start(puzzle);
    }
  }, [puzzle, start, storedPlay?.levelId]);

  // De eerste render gebeurt vóór de start-effect; een leeg bord is dan het
  // juiste beeld en houdt de pagina zonder flikkering bruikbaar.
  const play = storedPlay?.levelId === puzzle.id ? storedPlay : createMurdokuPlay(puzzle.id);
  const revealSentence = revealSentenceFor(puzzle, text, play, t);
  const progressMessage = progressSentenceFor(lastRound, t);
  const hintMessage = hint ? text.explanation(hint.explanation) : null;
  const clueMessage = clueFocusLabel
    ? text.explanation({ key: "board.wordOn", params: { word: clueFocusLabel } })
    : null;

  return (
    <GameShell
      onBack={() => {
        abandon();
        navigate({ to: "/" });
      }}
      showSpeech={false}
      subtitle={`${title} · ${puzzle.board.width} × ${puzzle.board.height}`}
      title={t.title}
      wideLandscape
    >
      <MurdokuGameBody
        canCheck={play.phase === "playing" && everyonePlaced(puzzle, play)}
        caseView={{ puzzle, text, title, intro, loot }}
        historyLength={historyLength}
        hintView={{
          hint,
          hintMessage,
          clueFocus,
          clueMessage,
          onHint: showHint,
          onFocusWord: focusClue,
        }}
        play={play}
        progressMessage={progressMessage}
        revealSentence={revealSentence}
        settingsView={{ settings, onAutoCross: setAutoCross }}
        actions={{
          cellTap: tapCell,
          check: () => check(solution),
          chooseCase: () => {
            abandon();
            navigate({ to: "/mysterie/zaken" });
          },
          help: () => navigate({ to: "/mysterie/les" }),
          home: () => {
            abandon();
            navigate({ to: "/" });
          },
          restart: () => start(puzzle),
          selectPerson,
          toggleCross: () => setMode(play.mode === "cross" ? "place" : "cross"),
          undo,
        }}
      />
    </GameShell>
  );
}
