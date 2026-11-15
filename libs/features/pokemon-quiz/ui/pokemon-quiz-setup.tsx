import { PokemonAssetsCredits } from "@entities/pokedex";
import { OptionPicker, SetupActions } from "@shared/ui";
import { POKEMON_QUIZ_DIFFICULTY_OPTIONS, type PokemonQuizSettings } from "../model/settings";
import type { QuizDifficulty } from "../model/quiz";

interface PokemonQuizSetupProps {
  settings: PokemonQuizSettings;
  onDifficultyChange: (difficulty: QuizDifficulty) => void;
  onStart: () => void;
}

export function PokemonQuizSetup({ settings, onDifficultyChange, onStart }: PokemonQuizSetupProps) {
  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 font-display text-2xl">Nieuw spel</h2>

      <OptionPicker
        columns={2}
        legend="Moeilijkheid"
        options={POKEMON_QUIZ_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />

      <SetupActions onStart={onStart} />

      <PokemonAssetsCredits />
    </section>
  );
}
