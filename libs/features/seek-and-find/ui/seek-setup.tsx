import type { SeekDifficulty, SeekTheme } from "@entities/hidden-object";
import { useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel } from "@shared/ui";
import { SEEK_DIFFICULTY_OPTIONS, SEEK_THEME_OPTIONS, type SeekSettings } from "../model/settings";
import { seekTexts } from "../model/texts";

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
  const t = useTexts(seekTexts).setup;
  const difficultyOptions = SEEK_DIFFICULTY_OPTIONS.map((option) => ({
    ...option,
    label: t.difficulties[option.value],
  }));
  const themeOptions = SEEK_THEME_OPTIONS.map(({ value }) => ({ value, ...t.themes[value] }));
  return (
    <SetupPanel onStart={onStart}>
      <OptionPicker
        legend={t.difficulty}
        options={difficultyOptions}
        selected={settings.difficulty}
        size="compact"
        onSelect={onDifficultyChange}
      />

      <OptionPicker
        columns={2}
        legend={t.theme}
        options={themeOptions}
        selected={settings.theme}
        size="compact"
        onSelect={onThemeChange}
      />
    </SetupPanel>
  );
}
