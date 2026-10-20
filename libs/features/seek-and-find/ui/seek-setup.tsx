import type { SeekDifficulty, SeekTheme } from "@entities/hidden-object";
import { OptionPicker, SetupActions } from "@shared/ui";
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
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 font-display text-2xl">Nieuw spel</h2>

      <OptionPicker
        legend="Moeilijkheid"
        options={SEEK_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />

      <div className="mt-5">
        <OptionPicker
          columns={2}
          legend="Waar zoek je?"
          options={SEEK_THEME_OPTIONS}
          selected={settings.theme}
          onSelect={onThemeChange}
        />
      </div>

      <SetupActions onStart={onStart} />
    </section>
  );
}
