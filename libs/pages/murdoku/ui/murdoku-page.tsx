import { useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { loadMurdokuLevel } from "@entities/murdoku";
import {
  MURDOKU_INTRO_LEVEL,
  MurdokuClueCards,
  MurdokuObjectLegend,
  createMurdokuPlay,
  createMurdokuText,
  useMurdokuStore,
} from "@features/murdoku-game";
import { GameShell } from "@widgets/game-shell";
import { MurdokuBoardSection } from "./murdoku-board-section";

/**
 * Wie was het? — het instapscherm van de logicazaak.
 *
 * Het bord start leeg. Een kind kiest een persoon, tikt op een vakje om hem te
 * plaatsen en nog eens om hem weg te halen. De kruisjesstand streep vakjes weg,
 * auto-kruis doet de rij en kolom van een geplaatst persoon, en ongedaan maken
 * zet de vorige bordtoestand terug.
 */
export function MurdokuPage() {
  const navigate = useNavigate();
  const puzzle = useMemo(() => loadMurdokuLevel(MURDOKU_INTRO_LEVEL), []);
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);
  const start = useMurdokuStore((state) => state.start);
  const selectPerson = useMurdokuStore((state) => state.selectPerson);
  const setMode = useMurdokuStore((state) => state.setMode);
  const tapCell = useMurdokuStore((state) => state.tapCell);
  const undo = useMurdokuStore((state) => state.undo);
  const storedPlay = useMurdokuStore((state) => state.play);
  const historyLength = useMurdokuStore((state) => state.history.length);
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

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      showSpeech={false}
      subtitle={`${title} · 4 × 4`}
      title="Wie was het?"
    >
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Er is iets gestolen. Lees de aanwijzingen en zoek wie als enige bij Vera was.
        </p>

        <MurdokuBoardSection
          canUndo={historyLength > 0}
          play={play}
          puzzle={puzzle}
          title={title}
          onCellTap={tapCell}
          onToggleCross={toggleCross}
          onUndo={undo}
        />

        <section aria-labelledby="murdoku-personen" className="flex flex-col gap-2.5">
          <h2 className="font-display text-xl" id="murdoku-personen">
            Wie is wie?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {text.rule("aloneWithVictim")}
          </p>
          <MurdokuClueCards puzzle={puzzle} selectedId={play.selected} onSelect={selectPerson} />
        </section>

        <section aria-labelledby="murdoku-legenda" className="flex flex-col gap-2.5">
          <h2 className="font-display text-xl" id="murdoku-legenda">
            Waar mag je staan?
          </h2>
          <MurdokuObjectLegend puzzle={puzzle} />
        </section>
      </div>
    </GameShell>
  );
}
