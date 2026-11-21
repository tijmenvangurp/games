import {
  BOARD_SIZES,
  COMPUTER_LEVELS,
  MODES,
  fourInARowLabels,
  startingPlayerAfter,
  type BoardSize,
  type ComputerLevel,
  type FourInARowGame,
  type FourInARowMode,
  type Player,
} from "@entities/four-in-a-row";
import { useTexts } from "@shared/i18n";
import { Button, OptionPicker, Panel, SetupPanel } from "@shared/ui";
import { playerName, standText } from "../model/presentation";
import type { FourInARowSettings } from "../model/settings";
import { fourInARowTexts } from "../model/texts";

interface FourInARowSetupProps {
  settings: FourInARowSettings;
  score: Record<Player, number>;
  game: FourInARowGame | null;
  onSizeChange: (size: BoardSize) => void;
  onModeChange: (mode: FourInARowMode) => void;
  onLevelChange: (level: ComputerLevel) => void;
  onResetScore: () => void;
  onStart: () => void;
}

export function FourInARowSetup({
  settings,
  score,
  game,
  onSizeChange,
  onModeChange,
  onLevelChange,
  onResetScore,
  onStart,
}: FourInARowSetupProps) {
  const t = useTexts(fourInARowTexts);
  const labels = useTexts(fourInARowLabels);
  const modeOptions = MODES.map((value) => ({ value, label: t.modes[value] }));
  const levelOptions = COMPUTER_LEVELS.map((value) => ({ value, label: labels.levels[value] }));
  const sizeOptions = BOARD_SIZES.map((value) => ({ value, label: labels.boardSizes[value] }));
  const againstComputer = settings.mode === "computer";
  // Tegen de computer begint het kind altijd; samen begint de verliezer.
  const startingPlayer = againstComputer ? "one" : startingPlayerAfter(game);

  return (
    <SetupPanel onStart={onStart}>
      <OptionPicker
        columns={2}
        legend={t.opponent}
        options={modeOptions}
        selected={settings.mode}
        size="compact"
        onSelect={onModeChange}
      />

      {againstComputer ? (
        <OptionPicker
          columns={3}
          legend={t.level}
          options={levelOptions}
          selected={settings.level}
          size="compact"
          onSelect={onLevelChange}
        />
      ) : null}

      <OptionPicker
        columns={2}
        legend={t.size}
        options={sizeOptions}
        selected={settings.size}
        onSelect={onSizeChange}
      />

      <Panel className="flex items-center justify-between gap-2" padding="sm" surface="subtle">
        <div className="min-w-0">
          <p className="text-sm font-bold tabular-nums">
            {t.stand(standText(score, settings.mode))}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.startsMatch(playerName(startingPlayer, settings.mode))}
          </p>
        </div>
        <Button className="shrink-0" size="sm" variant="ghost" onClick={onResetScore}>
          {t.resetScore}
        </Button>
      </Panel>

      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>{t.rules.turns}</li>
        <li>{t.rules.win}</li>
        <li>{t.rules.draw}</li>
        <li>{t.rules[settings.mode]}</li>
      </ul>
    </SetupPanel>
  );
}
