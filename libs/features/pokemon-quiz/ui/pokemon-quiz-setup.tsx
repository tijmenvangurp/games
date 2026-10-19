import { PokemonAssetsCredits } from "@entities/pokedex";
import { OptionPicker, SetupActions } from "@shared/ui";
import {
  POKEMON_QUIZ_MODE_OPTIONS,
  pokemonQuizDifficultyOptions,
  type PokemonQuizSettings,
} from "../model/settings";
import type { QuizDifficulty, QuizMode } from "../model/quiz";

interface PokemonQuizSetupProps {
  settings: PokemonQuizSettings;
  hasActiveGame: boolean;
  onDifficultyChange: (difficulty: QuizDifficulty) => void;
  onModeChange: (mode: QuizMode) => void;
  onStart: () => void;
  onBack: () => void;
}

export function PokemonQuizSetup({
  settings,
  hasActiveGame,
  onDifficultyChange,
  onModeChange,
  onStart,
  onBack,
}: PokemonQuizSetupProps) {
  const soundMode = settings.mode === "geluid";
  const pictureMode = settings.mode === "plaatje";

  const explanation = soundMode
    ? "Je hoort de Pokémon en kiest het juiste plaatje. Hoe moeilijker, hoe meer plaatjes je ziet. Tik op de luidspreker om opnieuw te luisteren."
    : pictureMode
      ? "Je ziet de Pokémon. Beluister de geluiden en kies het geluid dat bij deze Pokémon hoort. Hoe moeilijker, hoe meer geluiden je hoort."
      : "Je ziet de Pokémon en kiest de juiste naam. Hoe moeilijker, hoe meer namen en hoe minder je van de Pokémon ziet. Op de moeilijkste stand beweegt het silhouet langzaam voorbij.";

  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">{explanation}</p>
      </div>

      <OptionPicker
        columns={3}
        legend="Spelvorm"
        options={POKEMON_QUIZ_MODE_OPTIONS}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      <div className="mt-4">
        <OptionPicker
          columns={2}
          legend="Moeilijkheid"
          options={pokemonQuizDifficultyOptions(settings.mode)}
          selected={settings.difficulty}
          onSelect={onDifficultyChange}
        />
      </div>

      <SetupActions
        backLabel="Terug naar je spel"
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
      />

      <PokemonAssetsCredits />
    </section>
  );
}
