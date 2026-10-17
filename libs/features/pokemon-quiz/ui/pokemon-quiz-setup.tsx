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
    <section className="animate-rise rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">
          Hoeveel namen krijg je bij elk plaatje? Hoe moeilijker, hoe meer namen.
        </p>
      </div>

      <OptionPicker
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
