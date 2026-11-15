import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { drive, type TrayItem } from "@entities/gear";
import { playHaptic, playSound } from "@shared/lib";
import { connectionKey, isLinkPlacement } from "../model/placement";
import { useDraaiwerkStore, useSelectedTrayItem } from "../model/use-draaiwerk-store";
import { DraaiwerkBoard } from "./draaiwerk-board";
import { DraaiwerkHud } from "./draaiwerk-hud";
import { DraaiwerkTray } from "./draaiwerk-tray";
import { TrayArt } from "./gear-art";

interface DraaiwerkPlayProps {
  onLevels: () => void;
  onNext: () => void;
  hasNext: boolean;
  celebrate: boolean;
}

function trayIdFromActive(id: string | number): string | null {
  const value = String(id);
  return value.startsWith("tray:") ? value.slice("tray:".length) : null;
}

export function DraaiwerkPlay({ onLevels, onNext, hasNext, celebrate }: DraaiwerkPlayProps) {
  const level = useDraaiwerkStore((state) => state.level);
  const placements = useDraaiwerkStore((state) => state.placements);
  const pendingGearKey = useDraaiwerkStore((state) => state.pendingGearKey);
  const hintPlacement = useDraaiwerkStore((state) => state.hintPlacement);
  const [activeTrayId, setActiveTrayId] = useState<string | null>(null);
  const [activePlacedKey, setActivePlacedKey] = useState<string | null>(null);

  const result = useMemo(() => drive(level, placements), [level, placements]);
  const selectedItem = useSelectedTrayItem();
  const activeItem: TrayItem | null = activeTrayId
    ? (level.tray.find((item) => item.id === activeTrayId) ?? null)
    : null;
  const canMovePlaced = !selectedItem && !activeTrayId && !result.solved;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  const collisionDetection = useMemo<CollisionDetection>(
    () => (args) => {
      const allowed = (collision: { id: string | number }) => {
        const id = String(collision.id);
        if (activePlacedKey) {
          if (activePlacedKey.startsWith("belt:")) {
            return id === "tray-remove";
          }
          if (activePlacedKey.startsWith("loose:")) {
            return id.startsWith("gear:") || id === "tray-remove";
          }
          return id.startsWith("hole:") || id === "tray-remove";
        }
        if (activeItem?.kind === "belt" || activeItem?.kind === "chain") {
          return id.startsWith("gear:");
        }
        return id.startsWith("hole:");
      };
      const underPointer = pointerWithin(args).filter(allowed);
      if (underPointer.length > 0) {
        return underPointer;
      }
      return closestCenter(args).filter(allowed);
    },
    [activeItem, activePlacedKey],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith("tray:")) {
      setActiveTrayId(id.slice("tray:".length));
    } else if (id.startsWith("placed:")) {
      setActivePlacedKey(id.slice("placed:".length));
    } else {
      return;
    }
    playSound("tap");
    playHaptic("tap");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const over = event.over ? String(event.over.id) : null;
    const placedKey = activePlacedKey;
    const trayId = trayIdFromActive(event.active.id);
    setActiveTrayId(null);
    setActivePlacedKey(null);

    if (placedKey) {
      if (placedKey.startsWith("loose:")) {
        if (over?.startsWith("gear:")) {
          useDraaiwerkStore
            .getState()
            .extendLooseBelt(placedKey.slice("loose:".length), over.slice("gear:".length));
          return;
        }
        if (over === "tray-remove") {
          useDraaiwerkStore.getState().removePlaced(placedKey);
        }
        return;
      }
      if (over?.startsWith("hole:")) {
        useDraaiwerkStore.getState().movePlaced(placedKey, over.slice("hole:".length));
        return;
      }
      if (over === "tray-remove") {
        useDraaiwerkStore.getState().removePlaced(placedKey);
      }
      return;
    }

    if (!trayId || !over) {
      return;
    }

    if (over.startsWith("gear:")) {
      useDraaiwerkStore
        .getState()
        .dropTray(trayId, { kind: "gear", targetId: over.slice("gear:".length) });
      return;
    }
    if (over.startsWith("hole:")) {
      useDraaiwerkStore
        .getState()
        .dropTray(trayId, { kind: "hole", targetId: over.slice("hole:".length) });
    }
  };

  const activePlacedItem: TrayItem | null = useMemo(() => {
    if (!activePlacedKey) {
      return null;
    }
    if (activePlacedKey.startsWith("gear:")) {
      const pose = result.gears.find((gear) => gear.key === activePlacedKey);
      return pose ? { id: "drag", kind: "gear", size: pose.size } : null;
    }
    if (activePlacedKey.startsWith("loose:")) {
      const holeId = activePlacedKey.slice("loose:".length);
      const placement = placements.find(
        (candidate) => candidate.kind === "loose-belt" && candidate.holeId === holeId,
      );
      if (!placement || placement.kind !== "loose-belt") {
        return null;
      }
      if (placement.link === "chain") {
        return { id: "drag", kind: "chain" };
      }
      return { id: "drag", kind: "belt", crossed: placement.link === "crossed-belt" };
    }
    if (activePlacedKey.startsWith("belt:")) {
      const wantedKey = activePlacedKey.slice("belt:".length);
      const placement = placements.find(
        (candidate) => isLinkPlacement(candidate) && connectionKey(candidate) === wantedKey,
      );
      if (placement?.kind === "chain") {
        return { id: "drag", kind: "chain" };
      }
      if (placement?.kind === "open-belt" || placement?.kind === "crossed-belt") {
        return {
          id: "drag",
          kind: "belt",
          crossed: placement.kind === "crossed-belt",
        };
      }
      return null;
    }
    const holeId = activePlacedKey.slice("worm:".length);
    const placement = placements.find(
      (candidate) =>
        candidate.kind === "worm" &&
        (candidate.shaftHoleId === holeId || candidate.wheelHoleId === holeId),
    );
    return placement && placement.kind === "worm"
      ? {
          id: "drag",
          kind: "worm",
          shaftSize: placement.shaftSize,
          wheelSize: placement.wheelSize,
          ratio: placement.ratio,
          direction: placement.direction,
        }
      : null;
  }, [activePlacedKey, placements, result.gears]);

  const overlayItem = activeItem ?? activePlacedItem;

  return (
    <div className="flex min-h-0 flex-col gap-3 md:flex-1">
      <DraaiwerkHud
        level={level}
        result={result}
        celebrate={celebrate}
        hasNext={hasNext}
        onHint={() => useDraaiwerkStore.getState().hint()}
        onLevels={onLevels}
        onNext={onNext}
        onRemoveLast={() => useDraaiwerkStore.getState().removeLast()}
        onReset={() => useDraaiwerkStore.getState().reset()}
      />

      <DndContext
        collisionDetection={collisionDetection}
        sensors={sensors}
        onDragCancel={() => {
          setActiveTrayId(null);
          setActivePlacedKey(null);
        }}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-1 md:portrait:grid-rows-[minmax(0,1fr)_auto] md:landscape:grid-cols-7">
          <DraaiwerkBoard
            canMovePlaced={canMovePlaced}
            hintPlacement={hintPlacement}
            level={level}
            pendingGearKey={pendingGearKey}
            placements={placements}
            result={result}
            selectedItem={selectedItem}
            onGear={(key) => useDraaiwerkStore.getState().tapGear(key)}
            onHole={(holeId) => useDraaiwerkStore.getState().tapHole(holeId)}
            onLoose={(holeId) => useDraaiwerkStore.getState().selectLooseBelt(holeId)}
          />
          <DraaiwerkTray removing={Boolean(activePlacedKey)} />
        </div>

        <DragOverlay dropAnimation={null}>
          {overlayItem ? (
            <div className="draaiwerk-drag-token flex h-full w-full items-center justify-center">
              <TrayArt item={overlayItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
