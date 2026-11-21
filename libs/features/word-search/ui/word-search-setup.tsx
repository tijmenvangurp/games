import {
  WORD_SEARCH_DIFFICULTIES,
  WORD_SEARCH_THEMES,
  type WordSearchDifficulty,
  type WordSearchTheme,
} from "@entities/word-search";
import { useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel } from "@shared/ui";
import type { WordSearchSettings } from "../model/settings";
import { wordSearchTexts } from "./texts";

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
  const t = useTexts(wordSearchTexts);
  const difficultyOptions = WORD_SEARCH_DIFFICULTIES.map((value) => ({
    value,
    ...t.difficulties[value],
  }));
  const themeOptions = WORD_SEARCH_THEMES.map((value) => ({ value, ...t.themes[value] }));

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
        columns={3}
        legend={t.theme}
        options={themeOptions}
        selected={settings.theme}
        size="compact"
        onSelect={onThemeChange}
      />
    </SetupPanel>
  );
}
