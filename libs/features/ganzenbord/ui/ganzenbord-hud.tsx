import type { GanzenbordGame } from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { Lock, Trophy } from "@shared/ui";
import type { Wins } from "../model/storage";
import { playerColorClass, playerShortName, positionText } from "../model/presentation";

interface PlayerCardProps {
  game: GanzenbordGame;
  playerId: GanzenbordGame["current"];
  wins: Wins;
}

function PlayerCard({ game, playerId, wins }: PlayerCardProps) {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return null;
  }

  const active = player.id === game.current && game.status === "playing";
  const stuck = player.stuckOn !== null;

  return (
    <div
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-lg border bg-card px-2.5 py-2 transition",
        active ? "border-primary/60 shadow-sm ring-2 ring-primary/20" : "border-border",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-full", playerColorClass(player.id))}
        />
        <span className="truncate text-sm font-black">{playerShortName(player)}</span>
        <span
          aria-label={`${wins[player.id]} gewonnen partijen`}
          className="ml-auto flex shrink-0 items-center gap-1 text-xs font-bold text-muted-foreground"
        >
          <Trophy aria-hidden="true" className="size-3.5" />
          {wins[player.id]}
        </span>
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <span className="truncate">{positionText(player)}</span>
        {stuck ? <Lock aria-label="Vast" className="size-3 shrink-0 text-danger" /> : null}
        {player.skipTurns > 0 ? (
          <span className="shrink-0 rounded bg-warning/15 px-1 font-bold text-warning">
            beurt over
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/80">
        {player.controller === "computer" ? "Computer" : "Mens"}
      </p>
    </div>
  );
}

interface GanzenbordHudProps {
  game: GanzenbordGame;
  wins: Wins;
}

export function GanzenbordHud({ game, wins }: GanzenbordHudProps) {
  return (
    <div aria-label="Spelers" className="grid grid-cols-2 gap-2" role="list">
      {game.players.map((player) => (
        <div key={player.id} role="listitem">
          <PlayerCard game={game} playerId={player.id} wins={wins} />
        </div>
      ))}
    </div>
  );
}
