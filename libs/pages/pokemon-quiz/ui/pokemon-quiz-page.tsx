import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  PokemonQuizPlay,
  PokemonQuizSetup,
  createQuizQuestion,
  usePokemonQuizStore,
} from "@features/pokemon-quiz";
import { GameShell } from "@widgets/game-shell";

export function PokemonQuizPage() {
  const navigate = useNavigate();
  const question = usePokemonQuizStore((state) => state.question);
  const settings = usePokemonQuizStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !question;

  const startGame = () => {
    usePokemonQuizStore.getState().start(createQuizQuestion(settings.difficulty));
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={question ? () => setShowSetup(true) : undefined}
      subtitle={
        question ? `${question.difficulty} · ${question.optionIds.length} namen` : "Kies je spel"
      }
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
            onStart={startGame}
          />
        </div>
      ) : (
        <PokemonQuizPlay />
      )}
    </GameShell>
  );
}
