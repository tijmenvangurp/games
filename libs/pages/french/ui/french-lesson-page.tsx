import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { getLesson, localizeLesson, type FrenchLesson } from "@entities/french";
import {
  FrenchFlashcards,
  FrenchQuiz,
  FrenchSentenceBuilder,
  useFrenchQuizStore,
} from "@features/french-listening";
import { useLanguage, useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { Button, GameIcon, LayoutGrid, Panel, Play, Puzzle, Trophy } from "@shared/ui";
import { frenchPageTexts } from "./texts";

type FrenchMode = "intro" | "quiz" | "cards" | "build";

export function FrenchLessonPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams({ from: "/frans/$lessonId" });
  const language = useLanguage();
  const t = useTexts(frenchPageTexts);
  const found = getLesson(lessonId);
  const lesson = found ? localizeLesson(found, language) : undefined;
  const [mode, setMode] = useState<FrenchMode>("intro");

  if (!lesson) {
    return (
      <GameShell
        onBack={() => navigate({ to: "/frans" })}
        showSpeech={false}
        subtitle={t.subtitle}
        title="Bonjour !"
        titleClassName="text-xl sm:text-2xl"
      >
        <Panel
          className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center"
          padding="lg"
        >
          <h2 className="font-display text-2xl">{t.notFoundTitle}</h2>
          <p className="text-muted-foreground">{t.notFound}</p>
          <Button size="lg" onClick={() => navigate({ to: "/frans" })}>
            {t.backToLessons}
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

  const reset = () => {
    useFrenchQuizStore.getState().reset();
    setMode("intro");
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/frans" })}
      onNewGame={mode === "intro" ? undefined : reset}
      showSpeech={false}
      subtitle={t.subtitle}
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      {mode === "intro" ? (
        <FrenchLessonIntro
          lesson={lesson}
          onBuild={startBuild}
          onCards={startCards}
          onQuiz={startQuiz}
        />
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

interface FrenchLessonIntroProps {
  lesson: FrenchLesson;
  onQuiz: (master: boolean) => void;
  onCards: () => void;
  onBuild: () => void;
}

/** Het beginscherm van een les: titel, aantal items en de keuze tussen de oefenvormen. */
function FrenchLessonIntro({ lesson, onQuiz, onCards, onBuild }: FrenchLessonIntroProps) {
  const t = useTexts(frenchPageTexts);
  const hasPhrases = lesson.items.some((item) => item.kind === "phrase" && item.reviewed);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <Panel as="section" className="text-center" padding="lg">
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-primary-soft text-primary">
          <GameIcon aria-hidden="true" name="french-lesson" size={30} />
        </span>
        <h2 className="mt-2 font-display text-3xl leading-snug">{lesson.title}</h2>
        <p className="mt-2 text-muted-foreground">{lesson.subtitle}</p>
        <p className="mt-3 text-sm font-semibold tabular-nums text-muted-foreground">
          {t.items(lesson.items.length, lesson.level)}
        </p>
      </Panel>

      <Button size="lg" onClick={() => onQuiz(false)}>
        <Play aria-hidden="true" className="size-5" />
        {t.startQuiz}
      </Button>
      <Button size="lg" variant="outline" onClick={() => onQuiz(true)}>
        <Trophy aria-hidden="true" className="size-5" />
        {t.master}
      </Button>
      <Button size="lg" variant="outline" onClick={onCards}>
        <LayoutGrid aria-hidden="true" className="size-5" />
        {t.cards}
      </Button>
      {hasPhrases ? (
        <Button size="lg" variant="outline" onClick={onBuild}>
          <Puzzle aria-hidden="true" className="size-5" />
          {t.build}
        </Button>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">{t.prototype}</p>
      <p className="text-center text-xs text-muted-foreground">{t.audioCredit}</p>
    </div>
  );
}
