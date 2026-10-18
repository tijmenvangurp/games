import { Link, useNavigate } from "@tanstack/react-router";
import { listPublishedLessons } from "@entities/french";
import { GameShell } from "@widgets/game-shell";
import { Play, Sparkles } from "@shared/ui";

export function FrenchPage() {
  const navigate = useNavigate();
  const lessons = listPublishedLessons();

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Frans luisteren · A1.2"
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground">
          Kies een les. Je hoort Frans en kiest de juiste Nederlandse vertaling.
        </p>

        {lessons.length === 0 ? (
          <p className="rounded-3xl border border-dashed bg-card/60 p-6 text-center text-muted-foreground">
            Er zijn nog geen lessen gepubliceerd.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                className="group flex min-h-40 flex-col rounded-3xl border bg-gradient-to-br from-sky-100 via-white to-blue-50 p-5 shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                params={{ lessonId: lesson.id }}
                to="/frans/$lessonId"
              >
                <div className="flex items-start justify-between">
                  <span aria-hidden="true" className="text-4xl">
                    {lesson.emoji}
                  </span>
                  <span className="grid size-9 place-items-center rounded-full bg-white/80 text-primary shadow-sm transition group-hover:bg-white">
                    <Play aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-black">{lesson.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{lesson.subtitle}</p>
                <span className="mt-auto pt-4 text-sm font-bold text-primary">
                  {lesson.items.length} items · {lesson.level}
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Sparkles aria-hidden="true" className="size-3.5" />
          Meer lessen komen eraan.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Audio: Piper (MIT) · stem Tom (dataset AGPLv3).
        </p>
      </div>
    </GameShell>
  );
}
