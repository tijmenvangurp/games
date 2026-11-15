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
  type DragOverEvent,
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
  const pendingHoleId = useDraaiwerkStore((state) => state.pendingHoleId);
  const pendingGearKey = useDraaiwerkStore((state) => state.pendingGearKey);
  const hintPlacement = useDraaiwerkStore((state) => state.hintPlacement);
  const [activeTrayId, setActiveTrayId] = useState<string | null>(null);
  const [activePlacedKey, setActivePlacedKey] = useState<string | null>(null);
  const [linkPath, setLinkPath] = useState<string[]>([]);

  const result = useMemo(() => drive(level, placements), [level, placements]);
  const selectedItem = useSelectedTrayItem();
  const activeItem: TrayItem | null = activeTrayId
    ? (level.tray.find((item) => item.id === activeTrayId) ?? null)
    : null;
  const linkDrag = activeItem?.kind === "belt" || activeItem?.kind === "chain";
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
          return id.startsWith("hole:") || id === "tray-remove";
        }
        if (linkDrag) {
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
    [activePlacedKey, linkDrag],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setLinkPath([]);
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

  const handleDragOver = (event: DragOverEvent) => {
    if (!activeItem || (activeItem.kind !== "belt" && activeItem.kind !== "chain")) {
      return;
    }
    const over = event.over ? String(event.over.id) : null;
    if (!over?.startsWith("gear:")) {
      return;
    }
    const key = over.slice("gear:".length);
    setLinkPath((previous) => {
      if (previous[previous.length - 1] === key) {
        return previous;
      }
      return [...previous.slice(-3), key];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const over = event.over ? String(event.over.id) : null;
    const placedKey = activePlacedKey;
    const trayId = trayIdFromActive(event.active.id);
    const path = linkPath;
    const isLinkTray = activeItem?.kind === "belt" || activeItem?.kind === "chain";
    setActiveTrayId(null);
    setActivePlacedKey(null);
    setLinkPath([]);

    if (placedKey) {
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

    if (isLinkTray && over.startsWith("gear:")) {
      const finalGear = over.slice("gear:".length);
      const previousGear = path[path.length - 2] ?? null;
      if (previousGear && previousGear !== finalGear) {
        useDraaiwerkStore.getState().connectTray(trayId, previousGear, finalGear);
        return;
      }
      useDraaiwerkStore.getState().dropTray(trayId, { kind: "gear", targetId: finalGear });
      return;
    }

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

  const activePlacedItem: TrayItem | null = useMemo(() => {
    if (!activePlacedKey) {
      return null;
    }
    if (activePlacedKey.startsWith("gear:")) {
      const pose = result.gears.find((gear) => gear.key === activePlacedKey);
      return pose ? { id: "drag", kind: "gear", size: pose.size } : null;
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
    const placement = placements.find(
      (candidate) =>
        candidate.kind === "lying-as" &&
        (`as:${candidate.holeA}` === activePlacedKey ||
          `as:${candidate.holeB}` === activePlacedKey),
    );
    return placement && placement.kind === "lying-as"
      ? {
          id: "drag",
          kind: "lying-as",
          sizeA: placement.sizeA,
          sizeB: placement.sizeB,
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
          setLinkPath([]);
        }}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-1 md:portrait:grid-rows-[minmax(0,1fr)_auto] md:landscape:grid-cols-7">
          <DraaiwerkBoard
            canMovePlaced={canMovePlaced}
            hintPlacement={hintPlacement}
            level={level}
            linkFromKey={linkPath[linkPath.length - 2] ?? null}
            pendingGearKey={pendingGearKey}
            pendingHoleId={pendingHoleId}
            placements={placements}
            result={result}
            selectedItem={selectedItem}
            onGear={(key) => useDraaiwerkStore.getState().tapGear(key)}
            onHole={(holeId) => useDraaiwerkStore.getState().tapHole(holeId)}
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
