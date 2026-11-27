import type { GanzenbordGame } from "@entities/ganzenbord";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Badge, Lock, Panel, Trophy } from "@shared/ui";
import type { Wins } from "../model/storage";
import { playerShortName, positionText } from "../model/presentation";
import { ganzenbordTexts, ganzenbordUiTexts } from "../model/texts";
import { PlayerToken } from "./player-token";

interface PlayerCardProps {
  game: GanzenbordGame;
  playerId: GanzenbordGame["current"];
  wins: Wins;
}

function PlayerCard({ game, playerId, wins }: PlayerCardProps) {
  const t = useTexts(ganzenbordUiTexts);
  const names = useTexts(ganzenbordTexts);
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return null;
  }

  const active = player.id === game.current && game.status === "playing";
  const stuck = player.stuckOn !== null;

  return (
    <Panel
      aria-current={active ? "true" : undefined}
      className={cn("px-3 py-2 transition", active && "border-primary/70 ring-2 ring-primary/20")}
      padding="none"
    >
      <div className="flex min-w-0 items-center gap-2">
        <PlayerToken color={player.color} className="size-5 shrink-0" />
        <span className="truncate text-sm font-bold">{playerShortName(player)}</span>
        <span className="text-xs text-muted-foreground">
          · {names.controllers[player.controller]}
        </span>
        <span
          aria-label={t.winsCount(wins[player.id])}
          className="ml-auto flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-muted-foreground"
        >
          <Trophy aria-hidden="true" className="size-3.5" />
          {wins[player.id]}
        </span>
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className="truncate">{positionText(player)}</span>
        {stuck ? <Lock aria-label={t.stuck} className="size-3 shrink-0 text-danger" /> : null}
        {player.skipTurns > 0 ? (
          <Badge size="sm" tone="warning">
            {t.skipBadge}
          </Badge>
        ) : null}
      </div>
    </Panel>
  );
}

interface GanzenbordHudProps {
  game: GanzenbordGame;
  wins: Wins;
}

export function GanzenbordHud({ game, wins }: GanzenbordHudProps) {
  const t = useTexts(ganzenbordUiTexts);
  return (
    <div aria-label={t.players} className="grid grid-cols-2 gap-2 lg:grid-cols-1" role="list">
      {game.players.map((player) => (
        <div key={player.id} role="listitem">
          <PlayerCard game={game} playerId={player.id} wins={wins} />
        </div>
      ))}
    </div>
  );
}
