import { useNavigate } from "@tanstack/react-router";
import { MURDOKU_CASES, loadMurdokuLevel, type MurdokuCase } from "@entities/murdoku";
import { useMurdokuStore } from "@features/murdoku-game";
import { cn } from "@shared/lib";
import { Check, Play } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

function statusLabel(solved: boolean): string {
  return solved ? "opgelost" : "nog niet gespeeld";
}

/**
 * De zaakkeuze van Wie was het?. Alle twaalf eigen zaken staan in één lijst,
 * met hun maat en of ze in deze sessie al zijn opgelost. Een tik start de zaak
 * in de bestaande store en opent de speelpagina; de opslag volgt in #125.
 */
export function MurdokuCaseListPage() {
  const navigate = useNavigate();
  const start = useMurdokuStore((state) => state.start);
  const solvedCaseIds = useMurdokuStore((state) => state.solvedCaseIds);
  const currentPlay = useMurdokuStore((state) => state.play);

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
          Begin met een kleine zaak of kies meteen een grote. Elke zaak heeft een eigen plattegrond
          en een eigen dader.
        </p>

        <ul aria-labelledby="murdoku-kies" className="grid gap-3 sm:grid-cols-2">
          {MURDOKU_CASES.map((entry) => {
            const isSolved = solved.has(entry.id);
            const { width, height } = entry.level.size;
            return (
              <li key={entry.id}>
                <button
                  aria-label={`${entry.title}, ${width} × ${height}, ${statusLabel(isSolved)}`}
                  className={cn(
                    "game-panel flex min-h-28 w-full flex-col gap-1 p-4 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                    isSolved ? "border-success/40" : "hover:bg-muted/50",
                  )}
                  type="button"
                  onClick={() => choose(entry)}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-display text-lg leading-tight">{entry.title}</span>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                        isSolved ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
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
