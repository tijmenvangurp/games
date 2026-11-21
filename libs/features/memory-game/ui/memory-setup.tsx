import { PokemonAssetsCredits } from "@entities/pokedex";
import { pairsForLevel } from "@entities/memory";
import { useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel, StatusBanner } from "@shared/ui";
import {
  memoryLevelOptions,
  memoryModeOptions,
  type MemoryMode,
  type MemorySettings,
} from "../model/settings";
import { memoryTexts } from "../model/texts";

interface MemorySetupProps {
  settings: MemorySettings;
  onModeChange: (mode: MemoryMode) => void;
  onLevelChange: (levelIndex: number) => void;
  onStart: () => void;
}

export function MemorySetup({ settings, onModeChange, onLevelChange, onStart }: MemorySetupProps) {
  const t = useTexts(memoryTexts);
  const autoPairs = pairsForLevel(settings.adaptive.levelIndex);

  return (
    <SetupPanel footer={<PokemonAssetsCredits />} subtitle={t.setupSubtitle} onStart={onStart}>
      <OptionPicker
        columns={2}
        legend={t.modeLegend}
        options={memoryModeOptions(t)}
        selected={settings.mode}
        size="compact"
        onSelect={onModeChange}
      />

      {settings.mode === "auto" ? (
        <StatusBanner className="text-sm font-medium" tone="success">
          <p className="font-bold">{t.autoStart(autoPairs)}</p>
          <p className="opacity-85">{t.autoExplain}</p>
        </StatusBanner>
      ) : (
        <OptionPicker
          columns={3}
          legend={t.levelLegend}
          options={memoryLevelOptions(t)}
          selected={settings.manualIndex}
          size="compact"
          onSelect={onLevelChange}
        />
      )}
    </SetupPanel>
  );
}
