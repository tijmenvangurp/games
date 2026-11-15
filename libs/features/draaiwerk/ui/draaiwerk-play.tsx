import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { drive, type TrayItem } from "@entities/gear";
import { playHaptic, playSound } from "@shared/lib";
import { trayShortLabel } from "../model/labels";
import { useDraaiwerkStore, useSelectedTrayItem } from "../model/use-draaiwerk-store";
import { DraaiwerkBoard } from "./draaiwerk-board";
import { DraaiwerkHud } from "./draaiwerk-hud";
import { DraaiwerkTray } from "./draaiwerk-tray";
import { TrayArt } from "./gear-art";

interface DraaiwerkPlayProps {
  onLevels: () => void;
}

function trayIdFromActive(id: string | number): string | null {
  const value = String(id);
  return value.startsWith("tray:") ? value.slice("tray:".length) : null;
}

export function DraaiwerkPlay({ onLevels }: DraaiwerkPlayProps) {
  const level = useDraaiwerkStore((state) => state.level);
  const placements = useDraaiwerkStore((state) => state.placements);
  const pendingHoleId = useDraaiwerkStore((state) => state.pendingHoleId);
  const pendingGearKey = useDraaiwerkStore((state) => state.pendingGearKey);
  const hintPlacement = useDraaiwerkStore((state) => state.hintPlacement);
  const [activeTrayId, setActiveTrayId] = useState<string | null>(null);

  const result = useMemo(() => drive(level, placements), [level, placements]);
  const selectedItem = useSelectedTrayItem();
  const activeItem: TrayItem | null = activeTrayId
    ? (level.tray.find((item) => item.id === activeTrayId) ?? null)
    : null;
  const linkDrag = activeItem?.kind === "belt" || activeItem?.kind === "chain";

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const collisionDetection = useMemo<CollisionDetection>(
    () => (args) => {
      const wanted = linkDrag ? "gear:" : "hole:";
      return closestCenter(args).filter((collision) => String(collision.id).startsWith(wanted));
    },
    [linkDrag],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const trayId = trayIdFromActive(event.active.id);
    if (!trayId) {
      return;
    }
    setActiveTrayId(trayId);
    playSound("tap");
    playHaptic("tap");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const trayId = trayIdFromActive(event.active.id);
    setActiveTrayId(null);
    if (!trayId || !event.over) {
      return;
    }

    const over = String(event.over.id);
    if (over.startsWith("hole:")) {
      useDraaiwerkStore
        .getState()
        .dropTray(trayId, { kind: "hole", targetId: over.slice("hole:".length) });
      return;
    }
    if (over.startsWith("gear:")) {
      useDraaiwerkStore
        .getState()
        .dropTray(trayId, { kind: "gear", targetId: over.slice("gear:".length) });
    }
  };

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

      <DndContext
        collisionDetection={collisionDetection}
        sensors={sensors}
        onDragCancel={() => setActiveTrayId(null)}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-1 md:portrait:grid-rows-[minmax(0,1fr)_auto] md:landscape:grid-cols-7">
          <DraaiwerkBoard
            hintPlacement={hintPlacement}
            level={level}
            linkDrag={linkDrag}
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

        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div className="game-card flex items-center gap-2 px-3 py-2 shadow-xl">
              <TrayArt item={activeItem} />
              <span className="text-sm font-bold">{trayShortLabel(activeItem)}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
