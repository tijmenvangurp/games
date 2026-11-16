import { useNavigate } from "@tanstack/react-router";
import { MURDOKU_LEVELS, loadMurdokuLevel, type MurdokuCase } from "@entities/murdoku";
import { murdokuCaseForLevel, useMurdokuStore } from "@features/murdoku-game";
import { cn } from "@shared/lib";
import { Check, Play, Sparkles } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

function statusLabel(solved: boolean): string {
  return solved ? "opgelost" : "nog niet gespeeld";
}

/**
 * De zaakkeuze van Wie was het?. Alle twaalf eigen zaken staan in de volgorde
 * van de niveauladder: eerst de bordgrootte, daarna de aanwijzingsdichtheid.
 * De zaak die bij het huidige niveau past krijgt een rustige markering; het
 * kind mag altijd zelf een andere zaak kiezen. Een tik start de zaak in de
 * bestaande store en opent de speelpagina.
 */
export function MurdokuCaseListPage() {
  const navigate = useNavigate();
  const start = useMurdokuStore((state) => state.start);
  const solvedCaseIds = useMurdokuStore((state) => state.solvedCaseIds);
  const currentPlay = useMurdokuStore((state) => state.play);
  const adaptive = useMurdokuStore((state) => state.adaptive);
  const recommended = murdokuCaseForLevel(adaptive?.levelIndex ?? 0);

  const solved = new Set(solvedCaseIds);
  if (currentPlay?.phase === "solved") {
    solved.add(currentPlay.levelId);
  }

  const choose = (entry: MurdokuCase) => {
    start(loadMurdokuLevel(entry.level));
    navigate({ to: "/mysterie" });
  };

  return (
    <GameShell
      backLabel="Terug naar de zaak"
      showSpeech={false}
      subtitle="Twaalf eigen zaken"
      title="Wie was het?"
      onBack={() => navigate({ to: "/mysterie" })}
    >
      <div className="flex flex-col gap-4 pb-2">
        <h2 className="font-display text-xl" id="murdoku-kies">
          Kies een zaak
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Begin met een kleine zaak of kies meteen een grote. De zaak met "Past bij jou" groeit met
          je mee; je mag altijd zelf een andere kiezen.
        </p>

        <ul aria-labelledby="murdoku-kies" className="grid gap-3 sm:grid-cols-2">
          {MURDOKU_LEVELS.map((entry) => {
            const isSolved = solved.has(entry.id);
            const isRecommended = entry.id === recommended.id;
            const { width, height } = entry.level.size;
            return (
              <li key={entry.id}>
                <button
                  aria-label={`${entry.title}, ${width} × ${height}, ${statusLabel(isSolved)}`}
                  className={cn(
                    "game-panel flex min-h-28 w-full flex-col gap-1 p-4 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                    isSolved ? "border-success/40" : "hover:bg-muted/50",
                    isRecommended && "ring-2 ring-primary/40",
                  )}
                  type="button"
                  onClick={() => choose(entry)}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-display text-lg leading-tight">{entry.title}</span>
                    <span className="flex shrink-0 flex-wrap justify-end gap-1">
                      {isRecommended ? (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          <Sparkles aria-hidden="true" className="size-3.5" />
                          Past bij jou
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                          isSolved
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isSolved ? (
                          <Check aria-hidden="true" className="size-3.5" />
                        ) : (
                          <Play aria-hidden="true" className="size-3.5" />
                        )}
                        {isSolved ? "Opgelost" : "Nog niet gespeeld"}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {width} × {height}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {entry.intro}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </GameShell>
  );
}
