import { useMemo } from "react";
import { drive } from "@entities/gear";
import { useDraaiwerkStore, useSelectedTrayItem } from "../model/use-draaiwerk-store";
import { DraaiwerkBoard } from "./draaiwerk-board";
import { DraaiwerkHud } from "./draaiwerk-hud";
import { DraaiwerkTray } from "./draaiwerk-tray";

interface DraaiwerkPlayProps {
  onLevels: () => void;
}

export function DraaiwerkPlay({ onLevels }: DraaiwerkPlayProps) {
  const level = useDraaiwerkStore((state) => state.level);
  const placements = useDraaiwerkStore((state) => state.placements);
  const pendingHoleId = useDraaiwerkStore((state) => state.pendingHoleId);
  const pendingGearKey = useDraaiwerkStore((state) => state.pendingGearKey);
  const hintPlacement = useDraaiwerkStore((state) => state.hintPlacement);

  const result = useMemo(() => drive(level, placements), [level, placements]);
  const selectedItem = useSelectedTrayItem();

  return (
    <div className="flex min-h-0 flex-col gap-3 md:flex-1">
      <DraaiwerkHud
        level={level}
        result={result}
        onHint={() => useDraaiwerkStore.getState().hint()}
        onLevels={onLevels}
        onRemoveLast={() => useDraaiwerkStore.getState().removeLast()}
        onReset={() => useDraaiwerkStore.getState().reset()}
      />

      <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-1 md:portrait:grid-rows-[minmax(0,1fr)_auto] md:landscape:grid-cols-7">
        <DraaiwerkBoard
          hintPlacement={hintPlacement}
          level={level}
          pendingGearKey={pendingGearKey}
          pendingHoleId={pendingHoleId}
          placements={placements}
          result={result}
          selectedItem={selectedItem}
          onGear={(key) => useDraaiwerkStore.getState().tapGear(key)}
          onHole={(holeId) => useDraaiwerkStore.getState().tapHole(holeId)}
        />
        <DraaiwerkTray />
      </div>
    </div>
  );
}
