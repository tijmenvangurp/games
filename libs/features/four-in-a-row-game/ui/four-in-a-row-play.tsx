import { isFinished } from "@entities/four-in-a-row";
import { statusText } from "../model/presentation";
import { useFourInARowStore } from "../model/use-four-in-a-row-store";
import { FourInARowBoard } from "./four-in-a-row-board";
import { FourInARowHud } from "./four-in-a-row-hud";

export function FourInARowPlay() {
  const game = useFourInARowStore((state) => state.game);
  const score = useFourInARowStore((state) => state.score);
  const mode = useFourInARowStore((state) => state.match?.mode ?? "friend");

  if (!game) {
    return null;
  }

  return (
    <div className="mx-auto my-auto flex w-full max-w-md flex-col gap-3 sm:max-w-xl">
      <FourInARowHud
        canUndo={game.drops.length > 0 && !isFinished(game)}
        current={game.current}
        mode={mode}
        score={score}
        onRestart={() => useFourInARowStore.getState().start()}
        onUndo={() => useFourInARowStore.getState().undo()}
      />

      <FourInARowBoard
        game={game}
        onDrop={(column) => useFourInARowStore.getState().drop(column)}
      />

      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {statusText(game, mode)}
      </p>
    </div>
  );
}
