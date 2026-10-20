import type { MolenspelGame, MolenspelPhase, MolenspelPlayer } from "@entities/molenspel";
import { cn } from "@shared/lib";

const PLAYER_LABEL: Readonly<Record<MolenspelPlayer, string>> = {
  wit: "Wit",
  zwart: "Zwart",
};

const PHASE_LABEL: Readonly<Record<MolenspelPhase, string>> = {
  plaatsen: "stenen leggen",
  schuiven: "stenen schuiven",
  vliegen: "stenen laten vliegen",
};

const PLAYER_STYLE: Readonly<Record<MolenspelPlayer, string>> = {
  wit: "bg-stone-100 text-stone-700 border-stone-300",
  zwart: "bg-zinc-800 text-zinc-50 border-zinc-900",
};

interface MolenspelHudProps {
  game: MolenspelGame;
}

export function MolenspelHud({ game }: MolenspelHudProps) {
  const turn = game.turn;
  const onBoard = game.board.reduce((total, piece) => (piece === turn ? total + 1 : total), 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold",
          PLAYER_STYLE[turn],
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-4 rounded-full border",
            turn === "wit" ? "border-stone-400 bg-white" : "border-zinc-900 bg-zinc-800",
          )}
        />
        {PLAYER_LABEL[turn]} is aan de beurt
      </span>
      <span className="rounded-full border bg-card px-3 py-1.5 text-sm font-semibold">
        {onBoard} op het bord
        {game.inHand[turn] > 0 ? ` · ${game.inHand[turn]} in de hand` : ""}
      </span>
      <span className="rounded-full border bg-card px-3 py-1.5 text-sm font-semibold">
        {PHASE_LABEL[game.phase]}
      </span>
    </div>
  );
}
