import type { MathLevel, MathMode } from "@entities/math";
import { useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel } from "@shared/ui";
import { bestKey, levelOptionsFor, modeOptions, type MathSettings } from "../model/settings";
import { mathTrainerTexts } from "../model/texts";

interface MathSetupProps {
  settings: MathSettings;
  best: Record<string, number>;
  onModeChange: (mode: MathMode) => void;
  onLevelChange: (level: MathLevel) => void;
  onStart: () => void;
}

export function MathSetup({
  settings,
  best,
  onModeChange,
  onLevelChange,
  onStart,
}: MathSetupProps) {
  const t = useTexts(mathTrainerTexts).setup;
  const bestScore = best[bestKey(settings.mode, settings.level)] ?? 0;

  return (
    <SetupPanel note={bestScore > 0 ? t.best(bestScore) : t.noScore} onStart={onStart}>
      <OptionPicker
        columns={2}
        legend={t.mode}
        options={modeOptions()}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      <OptionPicker
        legend={t.level}
        options={levelOptionsFor(settings.mode)}
        selected={settings.level}
        size="compact"
        onSelect={onLevelChange}
      />
    </SetupPanel>
  );
}
