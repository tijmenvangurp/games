import type { Difficulty, SudokuSize } from "@entities/sudoku";
import { useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel as SharedSetupPanel } from "@shared/ui";
import {
  DIFFICULTY_OPTIONS,
  MISTAKE_MODE_OPTIONS,
  SIZE_OPTIONS,
  symbolsFor,
  THEME_OPTIONS,
  type MistakeMode,
  type SudokuSettings,
  type SymbolTheme,
} from "../model/settings";
import { sudokuTexts } from "../model/texts";

interface SetupPanelProps {
  settings: SudokuSettings;
  isGenerating: boolean;
  onSizeChange: (size: SudokuSize) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onThemeChange: (theme: SymbolTheme) => void;
  onMistakeModeChange: (mode: MistakeMode) => void;
  onStart: () => void;
}

export function SetupPanel({
  settings,
  isGenerating,
  onSizeChange,
  onDifficultyChange,
  onThemeChange,
  onMistakeModeChange,
  onStart,
}: SetupPanelProps) {
  const preview = symbolsFor(settings.size, settings.theme);
  const t = useTexts(sudokuTexts).setup;
  const sizeOptions = SIZE_OPTIONS.map((option) => ({
    ...option,
    hint: t.sizeHints[option.value],
  }));
  const difficultyOptions = DIFFICULTY_OPTIONS.map(({ value }) => ({
    value,
    label: t.difficulties[value],
  }));
  const mistakeModeOptions = MISTAKE_MODE_OPTIONS.map(({ value }) => ({
    value,
    label: t.mistakeModes[value],
  }));
  const themeOptions = THEME_OPTIONS.map(({ value }) => ({ value, label: t.themes[value] }));

  return (
    <SharedSetupPanel
      headerAddon={
        <div
          aria-hidden="true"
          className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-lg tabular-nums"
        >
          {preview.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
        </div>
      }
      loading={isGenerating}
      onStart={onStart}
    >
      <OptionPicker
        legend={t.size}
        options={sizeOptions}
        selected={settings.size}
        onSelect={onSizeChange}
      />

      <OptionPicker
        legend={t.difficulty}
        options={difficultyOptions}
        selected={settings.difficulty}
        size="compact"
        onSelect={onDifficultyChange}
      />

      <OptionPicker
        columns={2}
        legend={t.mistakes}
        options={mistakeModeOptions}
        selected={settings.mistakeMode}
        size="compact"
        onSelect={onMistakeModeChange}
      />

      {settings.size !== 9 ? (
        <OptionPicker
          columns={2}
          legend={t.symbols}
          options={themeOptions}
          selected={settings.theme}
          size="compact"
          onSelect={onThemeChange}
        />
      ) : null}
    </SharedSetupPanel>
  );
}
