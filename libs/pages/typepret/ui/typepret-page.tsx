import { useNavigate } from "@tanstack/react-router";
import { LESSON_BY_ID, ROUND_LENGTH, type Verdict } from "@entities/typepret";
import { TypepretPlay, TypepretSetup, useTypepretStore } from "@features/typepret";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

const MESSAGES: Record<Verdict, { title: string; description: string }> = {
  ontgrendeld: {
    title: "Goed geoefend!",
    description: "Je typte rustig en netjes. De volgende les staat open.",
  },
  bijna: {
    title: "Bijna!",
    description: "Je bent dichtbij. Nog een keer oefenen en dan lukt het nog beter.",
  },
  nogmaals: {
    title: "Nog een keer oefenen",
    description: "Typ rustig en kijk niet naar je vingers. Elke ronde wordt makkelijker.",
  },
};

export function TypepretPage() {
  const navigate = useNavigate();
  const round = useTypepretStore((state) => state.round);
  const result = useTypepretStore((state) => state.result);
  const lessonId = useTypepretStore((state) => state.lessonId);
  const progress = useTypepretStore((state) => state.progress);
  const lesson = lessonId ? LESSON_BY_ID[lessonId] : undefined;
  const message = result ? MESSAGES[result.verdict] : undefined;

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={round ? () => useTypepretStore.getState().leave() : undefined}
      showSpeech={false}
      subtitle={lesson ? `${lesson.title} · ${ROUND_LENGTH} toetsen` : "Leer blind typen"}
      title="Typepret"
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
          againLabel="Nog een ronde"
          chooseLabel="Andere les"
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
