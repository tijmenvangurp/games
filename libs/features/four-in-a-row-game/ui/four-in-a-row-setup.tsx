import {
  BOARD_SIZE_OPTIONS,
  PLAYER_INFO,
  startingPlayerAfter,
  type BoardSize,
  type FourInARowGame,
  type Player,
} from "@entities/four-in-a-row";
import { Button, OptionPicker, SetupActions } from "@shared/ui";
import type { FourInARowSettings } from "../model/settings";

interface FourInARowSetupProps {
  settings: FourInARowSettings;
  score: Record<Player, number>;
  game: FourInARowGame | null;
  onSizeChange: (size: BoardSize) => void;
  onResetScore: () => void;
  onStart: () => void;
}

export function FourInARowSetup({
  settings,
  score,
  game,
  onSizeChange,
  onResetScore,
  onStart,
}: FourInARowSetupProps) {
  const startingPlayer = startingPlayerAfter(game);

  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 text-xl font-black">Nieuw spel</h2>

      <OptionPicker
        columns={2}
        legend="Grootte van het bord"
        options={BOARD_SIZE_OPTIONS}
        selected={settings.size}
        onSelect={onSizeChange}
      />

      <div className="mt-5 flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-bold">
            Stand: {PLAYER_INFO.one.label} {score.one} – {PLAYER_INFO.two.label} {score.two}
          </p>
          <p className="text-sm text-muted-foreground">
            {PLAYER_INFO[startingPlayer].label} begint deze partij.
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
        <li>De verliezer begint de volgende partij.</li>
      </ul>

      <SetupActions onStart={onStart} />
    </section>
  );
}
