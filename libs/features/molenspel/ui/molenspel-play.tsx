import { removablePieces, type MolenspelGame } from "@entities/molenspel";
import { MolenspelBoard } from "./molenspel-board";
import { MolenspelHud } from "./molenspel-hud";

interface MolenspelPlayProps {
  game: MolenspelGame;
  /** Melding na een tik die niets deed. */
  notice: string | null;
  canUndo: boolean;
  onBack: () => void;
  onRestart: () => void;
  onTap: (point: number) => void;
  onUndo: () => void;
}

function statusText(game: MolenspelGame): string {
  if (game.awaitRemoval) {
    return "Molentje! Pak nu een steen van je tegenstander door erop te tikken.";
  }
  if (game.inHand[game.turn] > 0) {
    return "Tik op een leeg punt om je steen te leggen.";
  }
  if (game.selected !== null) {
    return "Tik op een groen punt waar je steen naartoe gaat.";
  }
  return "Tik op een van je eigen stenen om hem te verschuiven.";
}

export function MolenspelPlay({
  game,
  notice,
  canUndo,
  onBack,
  onRestart,
  onTap,
  onUndo,
}: MolenspelPlayProps) {
  const removable = game.awaitRemoval ? removablePieces(game.board, game.turn) : [];

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-3 px-3 pb-safe pt-safe sm:px-4">
      <MolenspelHud game={game} />

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          <MolenspelBoard game={game} removable={removable} onTap={onTap} />
        </div>
      </div>

      <p
        aria-live="polite"
        className={
          notice
            ? "text-center text-sm font-bold text-rose-600"
            : "text-center text-sm font-semibold text-muted-foreground"
        }
      >
        {notice ?? statusText(game)}
      </p>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-xl border bg-card px-3 py-3 text-sm font-bold disabled:opacity-40"
          disabled={!canUndo}
          onClick={onUndo}
          type="button"
        >
          Terug
        </button>
        <button
          className="flex-1 rounded-xl border bg-card px-3 py-3 text-sm font-bold"
          onClick={onRestart}
          type="button"
        >
          Nieuw spel
        </button>
        <button
          className="flex-1 rounded-xl border bg-card px-3 py-3 text-sm font-bold"
          onClick={onBack}
          type="button"
        >
          Uitleg
        </button>
      </div>
    </div>
  );
}
