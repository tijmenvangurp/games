import type { WordSearchDifficulty, WordSearchTheme } from "@entities/word-search";
import { OptionPicker, SetupActions } from "@shared/ui";
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
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 font-display text-2xl">Nieuw spel</h2>

      <OptionPicker
        legend="Moeilijkheid"
        options={WORD_SEARCH_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />

      <div className="mt-5">
        <OptionPicker
          columns={3}
          legend="Welk thema?"
          options={WORD_SEARCH_THEME_OPTIONS}
          selected={settings.theme}
          onSelect={onThemeChange}
        />
      </div>

      <SetupActions onStart={onStart} />
    </section>
  );
}
