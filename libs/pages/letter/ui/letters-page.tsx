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
  return "Letterronde · 6 vragen";
}

function celebrationFor(round: LetterRound | null, known: readonly string[]) {
  if (round?.lesson === "woorden") {
    return {
      title: "Knap gelezen!",
      description: "Je las zes woorden. Probeer het nog eens met andere woorden.",
    };
  }

  if (round?.lesson === "trein") {
    return {
      title: "Knap gebouwd!",
      description: "Je bouwde zes woorden. Probeer het nog eens met andere woorden.",
    };
  }

  if (round?.lesson === "klankplek") {
    return {
      title: "Knap geluisterd!",
      description: "Je hoorde waar de klank zat. Probeer het nog eens met andere woorden.",
    };
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
