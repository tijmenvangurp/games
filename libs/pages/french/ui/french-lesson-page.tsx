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
import { Button, GameIcon, LayoutGrid, Panel, Play, Puzzle, Trophy } from "@shared/ui";

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
        showSpeech={false}
        subtitle="Frans luisteren"
        title="Bonjour !"
        titleClassName="text-xl sm:text-2xl"
      >
        <Panel
          className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center"
          padding="lg"
        >
          <h2 className="font-display text-2xl">Les niet gevonden</h2>
          <p className="text-muted-foreground">
            Deze les bestaat niet of is nog niet gepubliceerd.
          </p>
          <Button size="lg" onClick={() => navigate({ to: "/frans" })}>
            Terug naar lessen
          </Button>
        </Panel>
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
      showSpeech={false}
      subtitle="Frans luisteren"
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      {mode === "intro" ? (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <Panel as="section" className="text-center" padding="lg">
            <span className="mx-auto grid size-14 place-items-center rounded-xl bg-primary-soft text-primary">
              <GameIcon aria-hidden="true" name="french-lesson" size={30} />
            </span>
            <h2 className="mt-2 font-display text-3xl leading-snug">{lesson.title}</h2>
            <p className="mt-2 text-muted-foreground">{lesson.subtitle}</p>
            <p className="mt-3 text-sm font-semibold tabular-nums text-muted-foreground">
              {lesson.items.length} items · {lesson.level}
            </p>
          </Panel>

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

          <p className="text-center text-xs text-muted-foreground">
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
