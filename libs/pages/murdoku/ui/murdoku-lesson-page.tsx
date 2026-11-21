import { Link, useNavigate } from "@tanstack/react-router";
import { MurdokuLesson } from "@features/murdoku-game";
import { useTexts } from "@shared/i18n";
import { Button } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";
import { MURDOKU_PAGE_TEXTS } from "./texts";

/**
 * De uitleg van Wie was het? op een eigen route.
 *
 * Zeven schermen en een woordenlijst leggen de regels en de aanwijzingen uit. De
 * speelpagina opent deze pagina met de ?-knop; teruggaan brengt het kind naar de
 * zaak waar het mee bezig was. De uitleg raakt de speltoestand niet aan.
 */
export function MurdokuLessonPage() {
  const navigate = useNavigate();
  const t = useTexts(MURDOKU_PAGE_TEXTS);

  return (
    <GameShell
      backLabel={t.backToCase}
      showSpeech={false}
      subtitle={t.lesson.subtitle}
      title={t.lesson.title}
      onBack={() => navigate({ to: "/mysterie" })}
    >
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.lesson.intro}
        </p>
        <Button asChild className="min-h-11 self-start" variant="outline">
          <Link to="/mysterie">{t.lesson.toCase}</Link>
        </Button>
        <MurdokuLesson />
      </div>
    </GameShell>
  );
}
