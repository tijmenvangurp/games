import type { GanzenbordGame, PlayerState } from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { CELL_POINTS } from "../model/board-points";
import { playerName, positionText } from "../model/presentation";
import { GanzenbordPawn } from "./ganzenbord-pawn";

interface Offset {
  readonly x: number;
  readonly y: number;
}

function offsetsFor(count: number): readonly Offset[] {
  if (count <= 1) {
    return [{ x: 0, y: 0 }];
  }
  if (count === 2) {
    return [
      { x: -8, y: 0 },
      { x: 8, y: 0 },
    ];
  }
  if (count === 3) {
    return [
      { x: -8, y: -6 },
      { x: 8, y: -6 },
      { x: 0, y: 7 },
    ];
  }
  return [
    { x: -8, y: -7 },
    { x: 8, y: -7 },
    { x: -8, y: 7 },
    { x: 8, y: 7 },
  ];
}

function groupPlayers(players: readonly PlayerState[]): Map<number, PlayerState[]> {
  const groups = new Map<number, PlayerState[]>();
  for (const player of players) {
    const group = groups.get(player.position);
    if (group) {
      group.push(player);
    } else {
      groups.set(player.position, [player]);
    }
  }
  return groups;
}

function boardSummary(game: GanzenbordGame): string {
  const positions = game.players
    .map((player) => `${playerName(player)}: ${positionText(player).toLowerCase()}`)
    .join(", ");
  return `Ganzenbord met 63 vakjes. ${positions}.`;
}

interface GanzenbordBoardProps {
  game: GanzenbordGame;
}

export function GanzenbordBoard({ game }: GanzenbordBoardProps) {
  const groups = groupPlayers(game.players);
  const startPlayers = game.players.filter((player) => player.position === 0);

  return (
    <div aria-label={boardSummary(game)} className="ganzenbord-board relative" role="img">
      <div className="flex min-h-9 items-center gap-2 border-b border-[#7a4a24]/30 bg-[#f4e7cf] px-2 py-1">
        <span className="text-[10px] font-black uppercase tracking-wide text-[#6b4224]">Start</span>
        {startPlayers.length > 0 ? (
          startPlayers.map((player) => (
            <GanzenbordPawn
              key={player.id}
              active={player.id === game.current && game.status === "playing"}
              compact
              player={player}
            />
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Hier begin je</span>
        )}
      </div>
      <div className="relative">
        <img
          alt=""
          className="block h-auto w-full select-none"
          draggable={false}
          src="/ganzenbord/board.webp"
        />
        <div className="pointer-events-none absolute inset-0">
          {[...groups.entries()].map(([position, players]) => {
            const point = CELL_POINTS[position];
            if (!point) {
              return null;
            }
            const offsets = offsetsFor(players.length);
            return players.map((player, index) => {
              const offset = offsets[index] ?? offsets[0];
              return (
                <div
                  key={player.id}
                  className="ganzenbord-pawn-move absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(${point.x}% + ${offset.x}px)`,
                    top: `calc(${point.y}% + ${offset.y}px)`,
                  }}
                >
                  <GanzenbordPawn
                    active={player.id === game.current && game.status === "playing"}
                    className={cn(players.length > 2 && "sm:scale-90")}
                    compact={players.length > 2}
                    player={player}
                  />
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
