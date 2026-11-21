import { PLAYERS, type FourInARowMode, type Player } from "@entities/four-in-a-row";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Button, Panel, RotateCcw, Undo2 } from "@shared/ui";
import { playerName } from "../model/presentation";
import { fourInARowTexts } from "../model/texts";

function PlayerChip({
  player,
  name,
  score,
  active,
}: {
  player: Player;
  name: string;
  score: number;
  active: boolean;
}) {
  const t = useTexts(fourInARowTexts);
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 py-1.5 transition",
        // Neutrale nadruk: indigo is hier de kleur van speler een, niet "actief".
        active ? "border-foreground/35 bg-muted shadow-sm" : "border-border",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0 rounded-full",
          player === "one" ? "bg-player-one" : "bg-player-two",
        )}
      />
      <span className="truncate text-sm font-bold">{name}</span>
      <span aria-label={t.wins(score)} className="ml-auto text-sm font-black text-muted-foreground">
        {score}
      </span>
    </div>
  );
}

interface FourInARowHudProps {
  current: Player;
  score: Record<Player, number>;
  mode: FourInARowMode;
  canUndo: boolean;
  onUndo: () => void;
  onRestart: () => void;
}

export function FourInARowHud({
  current,
  score,
  mode,
  canUndo,
  onUndo,
  onRestart,
}: FourInARowHudProps) {
  const t = useTexts(fourInARowTexts);
  return (
    <Panel className="flex items-center justify-between gap-2 p-2 sm:p-3" padding="none">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        {PLAYERS.map((player) => (
          <PlayerChip
            key={player}
            active={player === current}
            name={playerName(player, mode)}
            player={player}
            score={score[player]}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          aria-label={t.undo}
          disabled={!canUndo}
          size="icon"
          variant="outline"
          onClick={onUndo}
        >
          <Undo2 aria-hidden="true" className="size-5" />
        </Button>
        <Button aria-label={t.restart} size="icon" variant="outline" onClick={onRestart}>
          <RotateCcw aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </Panel>
  );
}
