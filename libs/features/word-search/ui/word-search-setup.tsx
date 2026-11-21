import type { WordSearchDifficulty, WordSearchTheme } from "@entities/word-search";
import { OptionPicker, SetupPanel } from "@shared/ui";
import {
  WORD_SEARCH_DIFFICULTY_OPTIONS,
  WORD_SEARCH_THEME_OPTIONS,
  type WordSearchSettings,
} from "../model/settings";

interface WordSearchSetupProps {
  settings: WordSearchSettings;
  onThemeChange: (theme: WordSearchTheme) => void;
  onDifficultyChange: (difficulty: WordSearchDifficulty) => void;
  onStart: () => void;
}

export function WordSearchSetup({
  settings,
  onThemeChange,
  onDifficultyChange,
  onStart,
}: WordSearchSetupProps) {
  return (
    <SetupPanel onStart={onStart}>
      <OptionPicker
        legend="Moeilijkheid"
        options={WORD_SEARCH_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        size="compact"
        onSelect={onDifficultyChange}
      />

      <OptionPicker
        columns={3}
        legend="Welk thema?"
        options={WORD_SEARCH_THEME_OPTIONS}
        selected={settings.theme}
        size="compact"
        onSelect={onThemeChange}
      />
    </SetupPanel>
  );
}
