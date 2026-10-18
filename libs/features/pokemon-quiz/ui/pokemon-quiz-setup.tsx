import { PokemonAssetsCredits } from "@entities/pokedex";
import { OptionPicker, SetupActions } from "@shared/ui";
import { POKEMON_QUIZ_DIFFICULTY_OPTIONS, type PokemonQuizSettings } from "../model/settings";
import type { QuizDifficulty } from "../model/quiz";

interface PokemonQuizSetupProps {
  settings: PokemonQuizSettings;
  hasActiveGame: boolean;
  onDifficultyChange: (difficulty: QuizDifficulty) => void;
  onStart: () => void;
  onBack: () => void;
}

export function PokemonQuizSetup({
  settings,
  hasActiveGame,
  onDifficultyChange,
  onStart,
  onBack,
}: PokemonQuizSetupProps) {
  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">
          Hoe moeilijker, hoe meer namen en hoe minder je van de Pokémon ziet. Op de moeilijkste
          stand beweegt het silhouet langzaam voorbij.
        </p>
      </div>

      <OptionPicker
        columns={2}
        legend="Moeilijkheid"
        options={POKEMON_QUIZ_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />

      <SetupActions
        backLabel="Terug naar je spel"
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
      />

      <PokemonAssetsCredits />
    </section>
  );
}
