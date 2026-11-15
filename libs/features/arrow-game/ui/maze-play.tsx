import { useState } from "react";
import { useArrowsStore } from "../model/use-arrow-store";
import { statusTextFor, useMazeActions, useMazeTimers } from "../model/use-maze-actions";
import type { FlyingArrow } from "../model/use-maze-actions";
import { MazeBoard } from "./maze-board";
import { MazeHud } from "./maze-hud";

interface MazePlayProps {
  onBack: () => void;
}

export function MazePlay({ onBack }: MazePlayProps) {
  const level = useArrowsStore((state) => state.level);
  const levelIndex = useArrowsStore((state) => state.levelIndex);
  const removedIds = useArrowsStore((state) => state.removedIds);
  const status = useArrowsStore((state) => state.status);
  const hintId = useArrowsStore((state) => state.hintId);
  const history = useArrowsStore((state) => state.history);
  const [flying, setFlying] = useState<FlyingArrow | null>(null);
  const [blockedId, setBlockedId] = useState<number | null>(null);

  useMazeTimers(level.id, hintId, blockedId, setBlockedId, setFlying);
  const { handleTap, handleHint, handleUndo, handleRestart } = useMazeActions(
    level,
    setFlying,
    setBlockedId,
  );

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-3 px-3 pb-safe pt-safe sm:px-4">
      <MazeHud
        canUndo={history.length > 0}
        level={level}
        levelIndex={levelIndex}
        playing={status === "playing"}
        removedCount={removedIds.length}
        onBack={onBack}
        onHint={handleHint}
        onRestart={handleRestart}
        onUndo={handleUndo}
      />

      <div className="flex flex-1 items-center justify-center py-1">
        <div className="w-full max-w-xl">
          <MazeBoard
            blockedId={blockedId}
            disabled={status !== "playing"}
            flying={flying}
            hintId={hintId}
            level={level}
            removedIds={removedIds}
            onFlyingEnd={() => setFlying(null)}
            onTap={handleTap}
          />
        </div>
      </div>

      <p aria-live="polite" className="pb-2 text-center text-xs text-muted-foreground">
        {statusTextFor(status, blockedId, hintId)}
      </p>
    </div>
  );
}
