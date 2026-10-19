import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PokemonQuizPlay, PokemonQuizSetup, usePokemonQuizStore } from "@features/pokemon-quiz";
import { GameShell } from "@widgets/game-shell";

export function PokemonQuizPage() {
  const navigate = useNavigate();
  const question = usePokemonQuizStore((state) => state.question);
  const settings = usePokemonQuizStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !question;

  const startGame = () => {
    usePokemonQuizStore.getState().startNewGame();
    setShowSetup(false);
  };

  const subtitle = question
    ? `${question.difficulty} · ${question.optionIds.length} ${
        question.mode === "geluid" ? "plaatjes" : question.mode === "plaatje" ? "geluiden" : "namen"
      }`
    : "Kies je spel";

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={question ? () => setShowSetup(true) : undefined}
      subtitle={subtitle}
      title="Wie is deze Pokémon?"
      titleClassName="text-xl sm:text-2xl"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <PokemonQuizSetup
            hasActiveGame={Boolean(question)}
            settings={settings}
            onBack={() => setShowSetup(false)}
            onDifficultyChange={(difficulty) =>
              usePokemonQuizStore.getState().chooseDifficulty(difficulty)
            }
            onModeChange={(mode) => usePokemonQuizStore.getState().chooseMode(mode)}
            onStart={startGame}
          />
        </div>
      ) : (
        <PokemonQuizPlay />
      )}
    </GameShell>
  );
}
