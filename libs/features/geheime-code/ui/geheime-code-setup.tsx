import {
  geheimeCodeTexts,
  LEVELS,
  THEMES,
  type LevelId,
  type ThemeId,
} from "@entities/geheime-code";
import { useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel } from "@shared/ui";
import { geheimeCodePlayTexts } from "./texts";

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
  const names = useTexts(geheimeCodeTexts);
  const t = useTexts(geheimeCodePlayTexts);
  return (
    <SetupPanel title={t.setupTitle} onStart={onStart}>
      <OptionPicker
        columns="2-3"
        legend={t.theme}
        options={THEMES.map((option) => ({
          value: option,
          label: names.themes[option],
          description: names.themeDescriptions[option],
        }))}
        selected={theme}
        onSelect={onTheme}
      />
      <OptionPicker
        columns="2-3"
        legend={t.level}
        options={LEVELS.map((option) => ({
          value: option,
          label: names.levels[option],
          description: names.levelDescriptions[option],
        }))}
        selected={level}
        onSelect={onLevel}
      />
    </SetupPanel>
  );
}
