import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { loadMurdokuLevel } from "@entities/murdoku";
import {
  MURDOKU_INTRO_LEVEL,
  MURDOKU_INTRO_PLACEMENTS,
  MurdokuBoard,
  MurdokuClueCards,
  MurdokuObjectLegend,
  createMurdokuText,
} from "@features/murdoku-game";
import { GameShell } from "@widgets/game-shell";

/**
 * Wie was het? — het instapscherm van de logicazaak.
 *
 * #120 levert het wandelskelet: een echte 4×4-zaak met het bord, de
 * personenkaarten en de objectlegenda. Er is nog geen bediening; die komt in
 * #121. De drie verdachten staan daarom alvast op hun plek, zodat het bord laat
 * zien wat een zaak is.
 */
export function MurdokuPage() {
  const navigate = useNavigate();
  const puzzle = useMemo(() => loadMurdokuLevel(MURDOKU_INTRO_LEVEL), []);
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      showSpeech={false}
      subtitle={`${MURDOKU_INTRO_LEVEL.title ?? "De zaak"} · 4 × 4`}
      title="Wie was het?"
    >
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Er is iets gestolen. Lees de aanwijzingen en zoek wie als enige bij Vera was.
        </p>

        <section aria-labelledby="murdoku-plattegrond">
          <h2 className="sr-only" id="murdoku-plattegrond">
            De plattegrond
          </h2>
          <div className="game-panel p-3 sm:p-5">
            <div className="mx-auto w-full max-w-lg">
              <MurdokuBoard
                maxCellSize={120}
                placements={MURDOKU_INTRO_PLACEMENTS}
                puzzle={puzzle}
                title={MURDOKU_INTRO_LEVEL.title ?? "de zaak"}
              />
            </div>
          </div>
          <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
            De drie personen staan alvast op hun plek. Zelf plaatsen komt in de volgende stap.
          </p>
        </section>

        <section aria-labelledby="murdoku-personen" className="flex flex-col gap-2.5">
          <h2 className="font-display text-xl" id="murdoku-personen">
            Wie is wie?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {text.rule("aloneWithVictim")}
          </p>
          <MurdokuClueCards puzzle={puzzle} />
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
