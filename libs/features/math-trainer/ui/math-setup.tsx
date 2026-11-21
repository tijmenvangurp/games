import type { MathLevel, MathMode } from "@entities/math";
import { OptionPicker, SetupPanel } from "@shared/ui";
import { bestKey, levelOptionsFor, MATH_MODE_OPTIONS, type MathSettings } from "../model/settings";

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
  const bestScore = best[bestKey(settings.mode, settings.level)] ?? 0;

  return (
    <SetupPanel
      note={bestScore > 0 ? `Beste score: ${bestScore} van 10 sterren` : "Nog geen score"}
      onStart={onStart}
    >
      <OptionPicker
        columns={2}
        legend="Soort som"
        options={MATH_MODE_OPTIONS}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      <OptionPicker
        legend="Niveau"
        options={levelOptionsFor(settings.mode)}
        selected={settings.level}
        size="compact"
        onSelect={onLevelChange}
      />
    </SetupPanel>
  );
}
