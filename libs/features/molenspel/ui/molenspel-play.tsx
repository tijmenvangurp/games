import { removablePieces, type MolenspelGame } from "@entities/molenspel";
import { MolenspelBoard } from "./molenspel-board";
import { MolenspelHud } from "./molenspel-hud";

interface MolenspelPlayProps {
  game: MolenspelGame;
  onBack: () => void;
  onRestart: () => void;
  onTap: (point: number) => void;
}

function statusText(game: MolenspelGame): string {
  if (game.awaitRemoval) {
    return "Molentje! Pak nu een steen van je tegenstander door erop te tikken.";
  }
  if (game.inHand[game.turn] > 0) {
    return "Tik op een leeg punt om je steen te leggen.";
  }
  if (game.selected !== null) {
    return "Tik op het punt waar je steen naartoe gaat.";
  }
  return "Tik op een van je eigen stenen om hem te verschuiven.";
}

export function MolenspelPlay({ game, onBack, onRestart, onTap }: MolenspelPlayProps) {
  const removable = game.awaitRemoval ? removablePieces(game.board, game.turn) : [];

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-3 px-3 pb-safe pt-safe sm:px-4">
      <MolenspelHud game={game} />

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <MolenspelBoard game={game} removable={removable} onTap={onTap} />
        </div>
      </div>

      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {statusText(game)}
      </p>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm font-bold"
          onClick={onRestart}
          type="button"
        >
          Nieuw spel
        </button>
        <button
          className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm font-bold"
          onClick={onBack}
          type="button"
        >
          Uitleg
        </button>
      </div>
    </div>
  );
}
