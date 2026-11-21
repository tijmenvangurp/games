import { PokemonAssetsCredits } from "@entities/pokedex";
import { pairsForLevel } from "@entities/memory";
import { OptionPicker, SetupPanel, StatusBanner } from "@shared/ui";
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
    <SetupPanel
      footer={<PokemonAssetsCredits />}
      subtitle="Zoek de Pokémon-paren. De app kan het aantal paren laten meegroeien."
      onStart={onStart}
    >
      <OptionPicker
        columns={2}
        legend="Hoe kies je het niveau?"
        options={MEMORY_MODE_OPTIONS}
        selected={settings.mode}
        size="compact"
        onSelect={onModeChange}
      />

      {settings.mode === "auto" ? (
        <StatusBanner className="text-sm font-medium" tone="success">
          <p className="font-bold">Je begint bij {autoPairs} paren.</p>
          <p className="opacity-85">
            Twee goede paren op een rij en je gaat een stapje verder. Soms is het weer even zoeken;
            dat hoort erbij.
          </p>
        </StatusBanner>
      ) : (
        <OptionPicker
          columns={3}
          legend="Aantal paren"
          options={memoryLevelOptions()}
          selected={settings.manualIndex}
          size="compact"
          onSelect={onLevelChange}
        />
      )}
    </SetupPanel>
  );
}
