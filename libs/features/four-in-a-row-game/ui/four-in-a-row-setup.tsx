import {
  BOARD_SIZE_OPTIONS,
  COMPUTER_LEVEL_INFO,
  COMPUTER_LEVELS,
  startingPlayerAfter,
  type BoardSize,
  type ComputerLevel,
  type FourInARowGame,
  type FourInARowMode,
  type Player,
} from "@entities/four-in-a-row";
import { Button, OptionPicker, SetupActions } from "@shared/ui";
import { playerName, standText } from "../model/presentation";
import type { FourInARowSettings } from "../model/settings";

const MODE_OPTIONS: readonly { value: FourInARowMode; label: string }[] = [
  { value: "friend", label: "Samen spelen" },
  { value: "computer", label: "Computer" },
];

const LEVEL_OPTIONS = COMPUTER_LEVELS.map((value) => ({
  value,
  label: COMPUTER_LEVEL_INFO[value].label,
}));

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
  const againstComputer = settings.mode === "computer";
  // Tegen de computer begint het kind altijd; samen begint de verliezer.
  const startingPlayer = againstComputer ? "one" : startingPlayerAfter(game);

  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 text-xl font-black">Nieuw spel</h2>

      <OptionPicker
        columns={2}
        legend="Tegenstander"
        options={MODE_OPTIONS}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      {againstComputer ? (
        <div className="mt-5">
          <OptionPicker
            columns={3}
            legend="Niveau van de computer"
            options={LEVEL_OPTIONS}
            selected={settings.level}
            onSelect={onLevelChange}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <OptionPicker
          columns={2}
          legend="Grootte van het bord"
          options={BOARD_SIZE_OPTIONS}
          selected={settings.size}
          onSelect={onSizeChange}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-bold">Stand: {standText(score, settings.mode)}</p>
          <p className="text-sm text-muted-foreground">
            {playerName(startingPlayer, settings.mode)} begint deze partij.
          </p>
        </div>
        <Button className="shrink-0" size="sm" variant="ghost" onClick={onResetScore}>
          Stand op nul
        </Button>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
        <li>Om de beurt laat je een schijf in een kolom vallen.</li>
        <li>Vier op een rij, recht of schuin? Dan win je.</li>
        <li>Is het bord vol, dan is het gelijkspel.</li>
        {againstComputer ? (
          <li>Jij begint elke partij tegen de computer.</li>
        ) : (
          <li>De verliezer begint de volgende partij.</li>
        )}
      </ul>

      <SetupActions onStart={onStart} />
    </section>
  );
}
