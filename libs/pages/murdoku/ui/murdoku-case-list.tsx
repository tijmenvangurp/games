import { useNavigate } from "@tanstack/react-router";
import {
  MURDOKU_CASE_TEXTS,
  MURDOKU_LADDER,
  loadMurdokuLevel,
  type MurdokuCase,
} from "@entities/murdoku";
import { murdokuCaseForLevel, useMurdokuStore } from "@features/murdoku-game";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Check, ChoiceCard, Play, Sparkles } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";
import { MURDOKU_PAGE_TEXTS } from "./texts";

type MurdokuCaseListTexts = (typeof MURDOKU_PAGE_TEXTS)["nl"]["cases"];

function statusLabel(solved: boolean, t: MurdokuCaseListTexts): string {
  return solved ? t.solved : t.unplayed;
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
  const t = useTexts(MURDOKU_PAGE_TEXTS);
  const caseTexts = useTexts(MURDOKU_CASE_TEXTS);
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
      backLabel={t.backToCase}
      showSpeech={false}
      subtitle={t.cases.subtitle}
      title={t.title}
      onBack={() => navigate({ to: "/mysterie" })}
    >
      <div className="flex flex-col gap-4 pb-2">
        <h2 className="font-display text-xl" id="murdoku-kies">
          {t.cases.heading}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.cases.intro}
        </p>

        <ul aria-labelledby="murdoku-kies" className="grid gap-3 sm:grid-cols-2">
          {MURDOKU_LADDER.map((entry) => {
            const isSolved = solved.has(entry.id);
            const isRecommended = entry.id === recommended.id;
            const { width, height } = entry.level.size;
            const words = caseTexts[entry.id];
            const status = statusLabel(isSolved, t.cases);
            return (
              <li key={entry.id}>
                <ChoiceCard
                  ariaLabel={`${words.title}, ${width} × ${height}, ${status.toLowerCase()}`}
                  className="min-h-28 w-full items-start gap-1 p-4 text-left"
                  label={<span className="font-display text-lg leading-tight">{words.title}</span>}
                  selected={isRecommended}
                  description={
                    <span className="flex w-full flex-col gap-1">
                      <span
                        className={cn(
                          "flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
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
                        {status}
                      </span>
                      {isRecommended ? (
                        <span className="flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          <Sparkles aria-hidden="true" className="size-3.5" />
                          {t.cases.recommended}
                        </span>
                      ) : null}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {width} × {height}
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {words.intro}
                      </span>
                    </span>
                  }
                  onClick={() => choose(entry)}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </GameShell>
  );
}
