import type { Difficulty, SudokuSize } from "@entities/sudoku";
import { OptionPicker, Panel, SetupActions } from "@shared/ui";
import {
  DIFFICULTY_OPTIONS,
  MISTAKE_MODE_OPTIONS,
  SIZE_OPTIONS,
  symbolsFor,
  type MistakeMode,
  type SudokuSettings,
  type SymbolTheme,
} from "../model/settings";

const THEME_OPTIONS = [
  { value: "numbers" as SymbolTheme, label: "Cijfers" },
  { value: "animals" as SymbolTheme, label: "Dieren" },
] as const;

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

  return (
    <Panel as="section" className="animate-rise" padding="lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight">Nieuw spel</h2>
        <div
          aria-hidden="true"
          className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-lg tabular-nums"
        >
          {preview.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
        </div>
      </div>

      <OptionPicker
        legend="Grootte"
        options={SIZE_OPTIONS}
        selected={settings.size}
        onSelect={onSizeChange}
      />

      <div className="mt-5">
        <OptionPicker
          legend="Moeilijkheid"
          options={DIFFICULTY_OPTIONS}
          selected={settings.difficulty}
          size="compact"
          onSelect={onDifficultyChange}
        />
      </div>

      <div className="mt-5">
        <OptionPicker
          columns={2}
          legend="Fouten tonen"
          options={MISTAKE_MODE_OPTIONS}
          selected={settings.mistakeMode}
          size="compact"
          onSelect={onMistakeModeChange}
        />
      </div>

      {settings.size !== 9 ? (
        <div className="mt-5">
          <OptionPicker
            columns={2}
            legend="Symbolen"
            options={THEME_OPTIONS}
            selected={settings.theme}
            size="compact"
            onSelect={onThemeChange}
          />
        </div>
      ) : null}

      <SetupActions loading={isGenerating} onStart={onStart} />
    </Panel>
  );
}
