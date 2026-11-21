import type { SeekDifficulty, SeekTheme } from "@entities/hidden-object";
import { OptionPicker, SetupPanel } from "@shared/ui";
import { SEEK_DIFFICULTY_OPTIONS, SEEK_THEME_OPTIONS, type SeekSettings } from "../model/settings";

interface SeekSetupProps {
  settings: SeekSettings;
  onDifficultyChange: (difficulty: SeekDifficulty) => void;
  onThemeChange: (theme: SeekTheme) => void;
  onStart: () => void;
}

export function SeekSetup({
  settings,
  onDifficultyChange,
  onThemeChange,
  onStart,
}: SeekSetupProps) {
  return (
    <SetupPanel onStart={onStart}>
      <OptionPicker
        legend="Moeilijkheid"
        options={SEEK_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        size="compact"
        onSelect={onDifficultyChange}
      />

      <OptionPicker
        columns={2}
        legend="Waar zoek je?"
        options={SEEK_THEME_OPTIONS}
        selected={settings.theme}
        size="compact"
        onSelect={onThemeChange}
      />
    </SetupPanel>
  );
}
