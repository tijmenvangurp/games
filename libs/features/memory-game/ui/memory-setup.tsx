import { PokemonAssetsCredits } from "@entities/pokedex";
import { pairsForLevel } from "@entities/memory";
import { OptionPicker, SetupActions } from "@shared/ui";
import {
  MEMORY_MODE_OPTIONS,
  memoryLevelOptions,
  type MemoryMode,
  type MemorySettings,
} from "../model/settings";

interface MemorySetupProps {
  settings: MemorySettings;
  onModeChange: (mode: MemoryMode) => void;
  onLevelChange: (levelIndex: number) => void;
  onStart: () => void;
}

export function MemorySetup({ settings, onModeChange, onLevelChange, onStart }: MemorySetupProps) {
  const autoPairs = pairsForLevel(settings.adaptive.levelIndex);

  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">
          Zoek de Pokémon-paren. De app kan het aantal paren laten meegroeien.
        </p>
      </div>

      <OptionPicker
        columns={2}
        legend="Hoe kies je het niveau?"
        options={MEMORY_MODE_OPTIONS}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      {settings.mode === "auto" ? (
        <div className="mt-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          <p className="font-bold">Je begint bij {autoPairs} paren.</p>
          <p className="opacity-80">
            Twee goede paren op een rij en je gaat een stapje verder. Soms is het weer even zoeken;
            dat hoort erbij.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <OptionPicker
            columns={3}
            legend="Aantal paren"
            options={memoryLevelOptions()}
            selected={settings.manualIndex}
            onSelect={onLevelChange}
          />
        </div>
      )}

      <SetupActions onStart={onStart} />

      <PokemonAssetsCredits />
    </section>
  );
}
