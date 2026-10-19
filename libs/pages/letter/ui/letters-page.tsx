import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { knownLetters } from "@entities/letter";
import { LetterPlay, LetterSetup, useLetterStore } from "@features/letter-game";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

export function LettersPage() {
  const navigate = useNavigate();
  const round = useLetterStore((state) => state.round);
  const progress = useLetterStore((state) => state.progress);
  const finished = useLetterStore((state) => state.finished);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !round;
  const known = knownLetters(progress);
  const subtitle = round ? "Letterronde · 6 vragen" : "Hoor de klank en kies de letter";

  const startGame = () => {
    useLetterStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={round ? () => setShowSetup(true) : undefined}
      subtitle={subtitle}
      title="Letterpret"
    >
      {setupVisible ? <LetterSetup progress={progress} onStart={startGame} /> : <LetterPlay />}

      {finished && !setupVisible ? (
        <CelebrationDialog
          againLabel="Nog een ronde"
          chooseLabel="Naar de uitleg"
          confetti={false}
          description={
            known.length > 0
              ? `Deze letters ken je al: ${known.join(", ")}.`
              : "Je oefende met de letters. Ze komen later terug."
          }
          title="Knap geoefend!"
          onAgain={() => useLetterStore.getState().start()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
