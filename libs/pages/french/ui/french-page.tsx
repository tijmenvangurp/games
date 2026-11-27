import { Link, useNavigate } from "@tanstack/react-router";
import {
  allFrenchItems,
  dueItemIds,
  lessonStars,
  listPublishedLessons,
  localizeLesson,
} from "@entities/french";
import { useFrenchProgressStore } from "@features/french-listening";
import { useLanguage, useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { Button, GameIcon, LayoutGrid, Panel, Star } from "@shared/ui";
import { frenchPageTexts } from "./texts";

export function FrenchPage() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = useTexts(frenchPageTexts);
  const lessons = listPublishedLessons().map((lesson) => localizeLesson(lesson, language));
  const progress = useFrenchProgressStore((state) => state.progress);
  const dueCount = dueItemIds(progress, allFrenchItems()).length;

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      showSpeech={false}
      subtitle={t.homeSubtitle}
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground">{t.intro}</p>

        {lessons.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-card/60 p-6 text-center text-muted-foreground">
            {t.noLessons}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => {
              const stars = lessonStars(progress, lesson);
              return (
                <Link
                  key={lesson.id}
                  className="group flex focus-visible:outline-none"
                  params={{ lessonId: lesson.id }}
                  to="/frans/$lessonId"
                >
                  <Panel
                    className="flex h-full min-h-40 w-full flex-col group-focus-visible:ring-4 group-focus-visible:ring-primary/25"
                    interactive
                    padding="lg"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                        <GameIcon aria-hidden="true" name="french-lesson" size={24} />
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-xl leading-snug">{lesson.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{lesson.subtitle}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <span className="text-sm font-bold tabular-nums text-primary">
                        {t.items(lesson.items.length, lesson.level)}
                      </span>
                      <span aria-label={t.stars(stars)} className="flex gap-0.5" role="img">
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
                  </Panel>
                </Link>
              );
            })}
          </div>
        )}

        {dueCount > 0 ? (
          <Button size="lg" variant="outline" onClick={() => navigate({ to: "/frans/herhalen" })}>
            {t.reviewDue(dueCount)}
          </Button>
        ) : null}

        <Button size="lg" variant="outline" onClick={() => navigate({ to: "/frans/sorteren" })}>
          <LayoutGrid aria-hidden="true" className="size-5" />
          {t.sortWords}
        </Button>

        <p className="text-center text-xs text-muted-foreground">{t.moreLessons}</p>
        <p className="text-center text-xs text-muted-foreground">{t.audioCredit}</p>
      </div>
    </GameShell>
  );
}
