import { useState } from "react";
import {
  PokemonQuizPlay,
  PokemonQuizSetup,
  createQuizQuestion,
  usePokemonQuizStore,
} from "@features/pokemon-quiz";
import { GameShell } from "@widgets/game-shell";
import { useTexts } from "@shared/i18n";
import { useGameSetupNavigation } from "@shared/lib";
import { pokemonQuizPageTexts } from "./texts";

export function PokemonQuizPage() {
  const t = useTexts(pokemonQuizPageTexts);
  const question = usePokemonQuizStore((state) => state.question);
  const settings = usePokemonQuizStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !question;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(question),
    backToGameLabel: t.backToGame,
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
        question
          ? t.subtitle(t.difficulties[question.difficulty], question.optionIds.length)
          : t.chooseSubtitle
      }
      title={t.title}
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
