import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createMurdokuPlay, everyonePlaced, useMurdokuStore } from "@features/murdoku-game";
import { GameShell } from "@widgets/game-shell";
import { useShallow } from "zustand/react/shallow";
import { revealSentenceFor } from "./murdoku-copy";
import { MurdokuGameBody } from "./murdoku-game-body";
import { useMurdokuSession } from "./use-murdoku-session";

/**
 * Wie was het? — het speelscherm van de logicazaak.
 *
 * Het bord start leeg. Een kind kiest een persoon, tikt op een vakje om hem te
 * plaatsen en nog eens om hem weg te halen. De kruisjesstand streep vakjes weg,
 * auto-kruis doet de rij en kolom van een geplaatst persoon, en ongedaan maken
 * zet de vorige bordtoestand terug. Zodra iedereen staat, controleert het kind
 * de zaak; een goede controle onthult de dader en de kamer van het slachtoffer.
 */
export function MurdokuPage() {
  const navigate = useNavigate();
  const { start, selectPerson, setMode, tapCell, undo, check, storedPlay, historyLength } =
    useMurdokuStore(
      useShallow((state) => ({
        start: state.start,
        selectPerson: state.selectPerson,
        setMode: state.setMode,
        tapCell: state.tapCell,
        undo: state.undo,
        check: state.check,
        storedPlay: state.play,
        historyLength: state.history.length,
      })),
    );
  const { activeCase, puzzle, text, solution, title } = useMurdokuSession(storedPlay);

  useEffect(() => {
    if (storedPlay?.levelId !== puzzle.id) {
      start(puzzle);
    }
  }, [puzzle, start, storedPlay?.levelId]);

  // De eerste render gebeurt vóór de start-effect; een leeg bord is dan het
  // juiste beeld en houdt de pagina zonder flikkering bruikbaar.
  const play = storedPlay?.levelId === puzzle.id ? storedPlay : createMurdokuPlay(puzzle.id);
  const revealSentence = revealSentenceFor(puzzle, text, play);
  const intro =
    activeCase?.intro ??
    "Er is iets gestolen. Lees de aanwijzingen, plaats iedereen en zoek wie als enige bij Vera was.";

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      showSpeech={false}
      subtitle={`${title} · ${puzzle.board.width} × ${puzzle.board.height}`}
      title="Wie was het?"
    >
      <MurdokuGameBody
        canCheck={play.phase === "playing" && everyonePlaced(puzzle, play)}
        historyLength={historyLength}
        intro={intro}
        play={play}
        puzzle={puzzle}
        revealSentence={revealSentence}
        text={text}
        title={title}
        onCellTap={tapCell}
        onCheck={() => check(solution)}
        onHome={() => navigate({ to: "/" })}
        onRestart={() => start(puzzle)}
        onSelectPerson={selectPerson}
        onToggleCross={() => setMode(play.mode === "cross" ? "place" : "cross")}
        onUndo={undo}
      />
    </GameShell>
  );
}
