import { PokemonAssetsCredits } from "@entities/pokedex";
import { OptionPicker, SetupPanel } from "@shared/ui";
import { POKEMON_QUIZ_DIFFICULTY_OPTIONS, type PokemonQuizSettings } from "../model/settings";
import type { QuizDifficulty } from "../model/quiz";

interface PokemonQuizSetupProps {
  settings: PokemonQuizSettings;
  onDifficultyChange: (difficulty: QuizDifficulty) => void;
  onStart: () => void;
}

export function PokemonQuizSetup({ settings, onDifficultyChange, onStart }: PokemonQuizSetupProps) {
  return (
    <SetupPanel footer={<PokemonAssetsCredits />} onStart={onStart}>
      <OptionPicker
        columns={2}
        legend="Moeilijkheid"
        options={POKEMON_QUIZ_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />
    </SetupPanel>
  );
}
