import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { getLesson } from "@entities/french";
import {
  FrenchFlashcards,
  FrenchQuiz,
  FrenchSentenceBuilder,
  useFrenchQuizStore,
} from "@features/french-listening";
import { GameShell } from "@widgets/game-shell";
import { Button, LayoutGrid, Play, Puzzle, Sparkles, Trophy } from "@shared/ui";

type FrenchMode = "intro" | "quiz" | "cards" | "build";

export function FrenchLessonPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams({ from: "/frans/$lessonId" });
  const lesson = getLesson(lessonId);
  const [mode, setMode] = useState<FrenchMode>("intro");

  if (!lesson) {
    return (
      <GameShell
        onBack={() => navigate({ to: "/frans" })}
        subtitle="Frans luisteren"
        title="Bonjour !"
        titleClassName="text-xl sm:text-2xl"
      >
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border bg-card p-6 text-center shadow-sm">
          <h2 className="text-2xl font-black">Les niet gevonden</h2>
          <p className="text-muted-foreground">
            Deze les bestaat niet of is nog niet gepubliceerd.
          </p>
          <Button size="lg" onClick={() => navigate({ to: "/frans" })}>
            Terug naar lessen
          </Button>
        </div>
      </GameShell>
    );
  }

  const startQuiz = (master = false) => {
    useFrenchQuizStore.getState().start(lesson, lesson.items, master);
    setMode("quiz");
  };

  const startCards = () => {
    setMode("cards");
  };

  const startBuild = () => {
    setMode("build");
  };

  const hasPhrases = lesson.items.some((item) => item.kind === "phrase" && item.reviewed);

  const reset = () => {
    useFrenchQuizStore.getState().reset();
    setMode("intro");
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/frans" })}
      onNewGame={mode === "intro" ? undefined : reset}
      subtitle={`${lesson.title} · ${lesson.level}`}
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      {mode === "intro" ? (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <section className="rounded-3xl border bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 text-center shadow-sm">
            <span aria-hidden="true" className="text-5xl">
              {lesson.emoji}
            </span>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Thema
            </p>
            <h2 className="mt-1 text-3xl font-black">{lesson.title}</h2>
            <p className="mt-2 text-muted-foreground">{lesson.subtitle}</p>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {lesson.items.length} items · {lesson.level}
            </p>
          </section>

          <Button size="lg" onClick={() => startQuiz(false)}>
            <Play aria-hidden="true" className="size-5" />
            Start luisteroefening
          </Button>
          <Button size="lg" variant="outline" onClick={() => startQuiz(true)}>
            <Trophy aria-hidden="true" className="size-5" />
            Meestermodus
          </Button>
          <Button size="lg" variant="outline" onClick={startCards}>
            <LayoutGrid aria-hidden="true" className="size-5" />
            Oefen met kaarten
          </Button>
          {hasPhrases ? (
            <Button size="lg" variant="outline" onClick={startBuild}>
              <Puzzle aria-hidden="true" className="size-5" />
              Bouw de zin
            </Button>
          ) : null}

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Prototype · inhoud nog niet taalkundig gereviewd.
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Audio: Piper (MIT) · stem Tom (dataset AGPLv3).
          </p>
        </div>
      ) : mode === "quiz" ? (
        <FrenchQuiz />
      ) : mode === "cards" ? (
        <FrenchFlashcards lesson={lesson} />
      ) : (
        <FrenchSentenceBuilder lesson={lesson} />
      )}
    </GameShell>
  );
}
