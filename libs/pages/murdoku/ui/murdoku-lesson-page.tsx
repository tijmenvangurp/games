import { Link, useNavigate } from "@tanstack/react-router";
import { MurdokuLesson } from "@features/murdoku-game";
import { Button } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

/**
 * De uitleg van Wie was het? op een eigen route.
 *
 * Zeven schermen en een woordenlijst leggen de regels en de aanwijzingen uit. De
 * speelpagina opent deze pagina met de ?-knop; teruggaan brengt het kind naar de
 * zaak waar het mee bezig was. De uitleg raakt de speltoestand niet aan.
 */
export function MurdokuLessonPage() {
  const navigate = useNavigate();

  return (
    <GameShell
      backLabel="Terug naar de zaak"
      showSpeech={false}
      subtitle="Zeven stappen en een woordenlijst"
      title="Zo werkt het"
      onBack={() => navigate({ to: "/mysterie" })}
    >
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Lees één scherm per keer. Alles wat je leert, komt terug in de aanwijzingen van elke zaak.
        </p>
        <Button asChild className="min-h-11 self-start" variant="outline">
          <Link to="/mysterie">Naar de zaak</Link>
        </Button>
        <MurdokuLesson />
      </div>
    </GameShell>
  );
}
