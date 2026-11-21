import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { knownLetters, type LetterLesson, type LetterRound } from "@entities/letter";
import { LetterPlay, LetterSetup, useLetterStore } from "@features/letter-game";
import { useTexts } from "@shared/i18n";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";
import { lettersPageTexts } from "./texts";

type PageTexts = (typeof lettersPageTexts)["nl"];

function celebrationFor(t: PageTexts, round: LetterRound | null, known: readonly string[]) {
  const celebrations: Partial<Record<LetterLesson, { title: string; description: string }>> =
    t.celebrations;
  const celebration = round ? celebrations[round.lesson] : undefined;
  if (celebration) {
    return celebration;
  }

  return {
    title: t.practisedTitle,
    description: known.length > 0 ? t.known(known.join(", ")) : t.practised,
  };
}

export function LettersPage() {
  const navigate = useNavigate();
  const t = useTexts(lettersPageTexts);
  const round = useLetterStore((state) => state.round);
  const progress = useLetterStore((state) => state.progress);
  const finished = useLetterStore((state) => state.finished);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !round;
  const known = knownLetters(progress);
  const celebration = celebrationFor(t, round, known);

  const startGame = (lesson: LetterLesson) => {
    useLetterStore.getState().start(lesson);
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={round ? () => setShowSetup(true) : undefined}
      showSpeech={false}
      subtitle={round ? t.subtitles[round.lesson] : t.setupSubtitle}
      title={t.title}
    >
      {setupVisible ? <LetterSetup progress={progress} onStart={startGame} /> : <LetterPlay />}

      {finished && !setupVisible ? (
        <CelebrationDialog
          againLabel={t.again}
          chooseLabel={t.choose}
          confetti={false}
          description={celebration.description}
          title={celebration.title}
          onAgain={() => useLetterStore.getState().start(round?.lesson)}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
