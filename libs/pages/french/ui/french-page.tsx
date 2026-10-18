import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LESSON_ANIMAUX } from "@entities/french";
import { FrenchFlashcards, FrenchQuiz, useFrenchQuizStore } from "@features/french-listening";
import { GameShell } from "@widgets/game-shell";
import { Button, LayoutGrid, Play, Sparkles } from "@shared/ui";

type FrenchMode = "intro" | "quiz" | "cards";

export function FrenchPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<FrenchMode>("intro");

  const startQuiz = () => {
    useFrenchQuizStore.getState().start(LESSON_ANIMAUX);
    setMode("quiz");
  };

  const startCards = () => {
    setMode("cards");
  };

  const reset = () => {
    useFrenchQuizStore.getState().reset();
    setMode("intro");
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={mode === "intro" ? undefined : reset}
      subtitle={mode === "intro" ? "Frans luisteren · A1.2" : "Les animaux · A1.2"}
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      {mode === "intro" ? (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <section className="rounded-3xl border bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 text-center shadow-sm">
            <span aria-hidden="true" className="text-5xl">
              {LESSON_ANIMAUX.emoji}
            </span>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Thema
            </p>
            <h2 className="mt-1 text-3xl font-black">{LESSON_ANIMAUX.title}</h2>
            <p className="mt-2 text-muted-foreground">{LESSON_ANIMAUX.subtitle}</p>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {LESSON_ANIMAUX.items.length} items · {LESSON_ANIMAUX.level}
            </p>
          </section>

          <Button size="lg" onClick={startQuiz}>
            <Play aria-hidden="true" className="size-5" />
            Start luisteroefening
          </Button>
          <Button size="lg" variant="outline" onClick={startCards}>
            <LayoutGrid aria-hidden="true" className="size-5" />
            Oefen met kaarten
          </Button>

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
      ) : (
        <FrenchFlashcards lesson={LESSON_ANIMAUX} />
      )}
    </GameShell>
  );
}
