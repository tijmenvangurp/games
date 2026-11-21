import {
  LEVEL_DESCRIPTION,
  LEVEL_LABEL,
  LEVELS,
  THEME_DESCRIPTION,
  THEME_LABEL,
  THEMES,
  type LevelId,
  type ThemeId,
} from "@entities/geheime-code";
import { OptionPicker, SetupPanel } from "@shared/ui";

interface GeheimeCodeSetupProps {
  theme: ThemeId;
  level: LevelId;
  onTheme: (theme: ThemeId) => void;
  onLevel: (level: LevelId) => void;
  onStart: () => void;
}

export function GeheimeCodeSetup({
  theme,
  level,
  onTheme,
  onLevel,
  onStart,
}: GeheimeCodeSetupProps) {
  return (
    <SetupPanel title="Kies je code" onStart={onStart}>
      <OptionPicker
        columns="2-3"
        legend="Thema"
        options={THEMES.map((option) => ({
          value: option,
          label: THEME_LABEL[option],
          description: THEME_DESCRIPTION[option],
        }))}
        selected={theme}
        onSelect={onTheme}
      />
      <OptionPicker
        columns="2-3"
        legend="Niveau"
        options={LEVELS.map((option) => ({
          value: option,
          label: LEVEL_LABEL[option],
          description: LEVEL_DESCRIPTION[option],
        }))}
        selected={level}
        onSelect={onLevel}
      />
    </SetupPanel>
  );
}
