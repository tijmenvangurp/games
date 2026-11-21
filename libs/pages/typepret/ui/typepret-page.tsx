import { useNavigate } from "@tanstack/react-router";
import { LESSON_BY_ID, lessonText, ROUND_LENGTH, type Verdict } from "@entities/typepret";
import { TypepretPlay, TypepretSetup, useTypepretStore } from "@features/typepret";
import { useLanguage, useTexts } from "@shared/i18n";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";
import { typepretPageTexts } from "./texts";

export function TypepretPage() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = useTexts(typepretPageTexts);
  const round = useTypepretStore((state) => state.round);
  const result = useTypepretStore((state) => state.result);
  const lessonId = useTypepretStore((state) => state.lessonId);
  const progress = useTypepretStore((state) => state.progress);
  const lesson = lessonId ? LESSON_BY_ID[lessonId] : undefined;
  // Elke uitslag heeft een titel en uitleg in beide talen.
  const verdicts: Readonly<Record<Verdict, { title: string; description: string }>> = t.verdicts;
  const message = result ? verdicts[result.verdict] : undefined;

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={round ? () => useTypepretStore.getState().leave() : undefined}
      showSpeech={false}
      subtitle={
        lesson ? t.lessonSubtitle(lessonText(lesson, language).title, ROUND_LENGTH) : t.subtitle
      }
      title={t.title}
    >
      {round ? (
        <TypepretPlay />
      ) : (
        <TypepretSetup
          progress={progress}
          onStart={(id) => useTypepretStore.getState().start(id)}
        />
      )}

      {result && message ? (
        <CelebrationDialog
          againLabel={t.again}
          chooseLabel={t.choose}
          confetti={result.verdict === "ontgrendeld"}
          description={message.description}
          title={message.title}
          onAgain={() => useTypepretStore.getState().start(result.lessonId)}
          onChoose={() => useTypepretStore.getState().leave()}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
