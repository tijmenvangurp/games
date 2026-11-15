import { useState } from "react";
import {
  PokemonQuizPlay,
  PokemonQuizSetup,
  createQuizQuestion,
  usePokemonQuizStore,
} from "@features/pokemon-quiz";
import { GameShell } from "@widgets/game-shell";
import { useGameSetupNavigation } from "@shared/lib";

export function PokemonQuizPage() {
  const question = usePokemonQuizStore((state) => state.question);
  const settings = usePokemonQuizStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !question;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(question),
    backToGameLabel: "Terug naar je spel",
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });

  const startGame = () => {
    usePokemonQuizStore.getState().start(createQuizQuestion(settings.difficulty));
    setShowSetup(false);
  };

  return (
    <GameShell
      {...gameSetup}
      showSpeech={false}
      subtitle={
        question ? `${question.difficulty} · ${question.optionIds.length} namen` : "Kies je spel"
      }
      title="Wie is deze Pokémon?"
      titleClassName="text-xl sm:text-2xl"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <PokemonQuizSetup
            settings={settings}
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
