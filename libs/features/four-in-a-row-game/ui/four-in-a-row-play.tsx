import { isFinished, PLAYER_INFO, winnerOf, type FourInARowGame } from "@entities/four-in-a-row";
import { useFourInARowStore } from "../model/use-four-in-a-row-store";
import { FourInARowBoard } from "./four-in-a-row-board";
import { FourInARowHud } from "./four-in-a-row-hud";

function statusText(game: FourInARowGame): string {
  if (game.draw) {
    return "Het bord is vol: gelijkspel!";
  }

  const winner = winnerOf(game);
  if (winner) {
    return `${PLAYER_INFO[winner].label} heeft vier op een rij!`;
  }

  if (game.drops.length === 0) {
    return `${PLAYER_INFO[game.current].label} begint. Tik op een kolom om je schijf te laten vallen.`;
  }

  return `${PLAYER_INFO[game.current].label} is aan de beurt.`;
}

export function FourInARowPlay() {
  const game = useFourInARowStore((state) => state.game);
  const score = useFourInARowStore((state) => state.score);

  if (!game) {
    return null;
  }

  return (
    <div className="mx-auto my-auto flex w-full max-w-md flex-col gap-3 sm:max-w-xl">
      <FourInARowHud
        canUndo={game.drops.length > 0 && !isFinished(game)}
        current={game.current}
        score={score}
        onRestart={() => useFourInARowStore.getState().start()}
        onUndo={() => useFourInARowStore.getState().undo()}
      />

      <FourInARowBoard
        game={game}
        onDrop={(column) => useFourInARowStore.getState().drop(column)}
      />

      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {statusText(game)}
      </p>
    </div>
  );
}
