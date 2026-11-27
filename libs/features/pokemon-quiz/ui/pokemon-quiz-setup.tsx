import { PokemonAssetsCredits } from "@entities/pokedex";
import { useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel } from "@shared/ui";
import { pokemonQuizDifficultyOptions, type PokemonQuizSettings } from "../model/settings";
import { pokemonQuizTexts } from "../model/texts";
import type { QuizDifficulty } from "../model/quiz";

interface PokemonQuizSetupProps {
  settings: PokemonQuizSettings;
  onDifficultyChange: (difficulty: QuizDifficulty) => void;
  onStart: () => void;
}

export function PokemonQuizSetup({ settings, onDifficultyChange, onStart }: PokemonQuizSetupProps) {
  const t = useTexts(pokemonQuizTexts);
  return (
    <SetupPanel footer={<PokemonAssetsCredits />} onStart={onStart}>
      <OptionPicker
        columns={2}
        legend={t.difficultyLegend}
        options={pokemonQuizDifficultyOptions(t)}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />
    </SetupPanel>
  );
}
