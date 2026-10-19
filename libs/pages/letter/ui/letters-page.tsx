import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { knownLetters, type LetterLesson, type LetterRound } from "@entities/letter";
import { LetterPlay, LetterSetup, useLetterStore } from "@features/letter-game";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

function subtitleFor(round: LetterRound | null): string {
  if (!round) {
    return "Hoor de klank en kies de letter";
  }
  if (round.lesson === "woorden") {
    return "Woordlezen · 6 woorden";
  }
  if (round.lesson === "trein") {
    return "Woordtrein · 6 woorden";
  }
  if (round.lesson === "klankplek") {
    return "Klankplek · 6 woorden";
  }
  if (round.lesson === "zoemlees") {
    return "Zoemlees · 6 woorden";
  }
  return "Letterronde · 6 vragen";
}

const CELEBRATIONS: Partial<Record<LetterLesson, { title: string; description: string }>> = {
  woorden: {
    title: "Knap gelezen!",
    description: "Je las zes woorden. Probeer het nog eens met andere woorden.",
  },
  trein: {
    title: "Knap gebouwd!",
    description: "Je bouwde zes woorden. Probeer het nog eens met andere woorden.",
  },
  klankplek: {
    title: "Knap geluisterd!",
    description: "Je hoorde waar de klank zat. Probeer het nog eens met andere woorden.",
  },
  zoemlees: {
    title: "Knap gelezen!",
    description: "Je las zes woorden door de letters te verbinden.",
  },
};

function celebrationFor(round: LetterRound | null, known: readonly string[]) {
  const celebration = round ? CELEBRATIONS[round.lesson] : undefined;
  if (celebration) {
    return celebration;
  }

  return {
    title: "Knap geoefend!",
    description:
      known.length > 0
        ? `Deze letters ken je al: ${known.join(", ")}.`
        : "Je oefende met de letters. Ze komen later terug.",
  };
}

export function LettersPage() {
  const navigate = useNavigate();
  const round = useLetterStore((state) => state.round);
  const progress = useLetterStore((state) => state.progress);
  const finished = useLetterStore((state) => state.finished);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !round;
  const known = knownLetters(progress);
  const celebration = celebrationFor(round, known);

  const startGame = (lesson: LetterLesson) => {
    useLetterStore.getState().start(lesson);
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={round ? () => setShowSetup(true) : undefined}
      showSpeech={false}
      subtitle={subtitleFor(round)}
      title="Letterpret"
    >
      {setupVisible ? <LetterSetup progress={progress} onStart={startGame} /> : <LetterPlay />}

      {finished && !setupVisible ? (
        <CelebrationDialog
          againLabel="Nog een ronde"
          chooseLabel="Naar de uitleg"
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
