import type { MemoryDifficulty } from "@entities/memory";
import { PokemonAssetsCredits } from "@entities/pokedex";
import { OptionPicker, SetupActions } from "@shared/ui";
import { MEMORY_DIFFICULTY_OPTIONS, type MemorySettings } from "../model/settings";

interface MemorySetupProps {
  settings: MemorySettings;
  onDifficultyChange: (difficulty: MemoryDifficulty) => void;
  onStart: () => void;
}

export function MemorySetup({ settings, onDifficultyChange, onStart }: MemorySetupProps) {
  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 font-display text-2xl">Nieuw spel</h2>

      <OptionPicker
        legend="Moeilijkheid"
        options={MEMORY_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />

      <SetupActions onStart={onStart} />

      <PokemonAssetsCredits />
    </section>
  );
}
