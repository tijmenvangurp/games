import { Link, useNavigate } from "@tanstack/react-router";
import { allFrenchItems, dueItemIds, lessonStars, listPublishedLessons } from "@entities/french";
import { useFrenchProgressStore } from "@features/french-listening";
import { GameShell } from "@widgets/game-shell";
import { Button, GameIcon, LayoutGrid, Star } from "@shared/ui";

export function FrenchPage() {
  const navigate = useNavigate();
  const lessons = listPublishedLessons();
  const progress = useFrenchProgressStore((state) => state.progress);
  const dueCount = dueItemIds(progress, allFrenchItems()).length;

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      showSpeech={false}
      subtitle="Frans luisteren · A1.2"
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground">
          Kies een les. Je hoort Frans en kiest de juiste Nederlandse vertaling.
        </p>

        {lessons.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-card/60 p-6 text-center text-muted-foreground">
            Er zijn nog geen lessen gepubliceerd.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => {
              const stars = lessonStars(progress, lesson);
              return (
                <Link
                  key={lesson.id}
                  className="game-card group flex min-h-40 flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 active:translate-y-0"
                  params={{ lessonId: lesson.id }}
                  to="/frans/$lessonId"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-lg bg-muted text-primary">
                      <GameIcon aria-hidden="true" name="french-lesson" size={24} />
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-xl leading-snug">{lesson.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{lesson.subtitle}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-sm font-bold text-primary">
                      {lesson.items.length} items · {lesson.level}
                    </span>
                    <span aria-label={`${stars} van 3 sterren`} className="flex gap-0.5" role="img">
                      {[0, 1, 2].map((index) => (
                        <Star
                          key={index}
                          aria-hidden="true"
                          className={
                            index < stars
                              ? "size-4 fill-warning text-warning"
                              : "size-4 text-muted-foreground/30"
                          }
                        />
                      ))}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {dueCount > 0 ? (
          <Button size="lg" variant="outline" onClick={() => navigate({ to: "/frans/herhalen" })}>
            Herhaal {dueCount} {dueCount === 1 ? "item" : "items"}
          </Button>
        ) : null}

        <Button size="lg" variant="outline" onClick={() => navigate({ to: "/frans/sorteren" })}>
          <LayoutGrid aria-hidden="true" className="size-5" />
          Sorteer de woorden
        </Button>

        <p className="text-center text-xs text-muted-foreground">Meer lessen komen eraan.</p>
        <p className="text-center text-xs text-muted-foreground">
          Audio: Piper (MIT) · stem Tom (dataset AGPLv3).
        </p>
      </div>
    </GameShell>
  );
}
