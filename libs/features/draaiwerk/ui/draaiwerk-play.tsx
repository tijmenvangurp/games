import { useEffect, useMemo, useRef, useState } from "react";
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
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { animate } from "motion";
import { drive, type GearPose, type TrayItem } from "@entities/gear";
import { playHaptic, playSound } from "@shared/lib";
import { connectionKey, isLinkPlacement, looseBeltTarget } from "../model/placement";
import { useDraaiwerkStore, useSelectedTrayItem } from "../model/use-draaiwerk-store";
import {
  boardPointFromClient,
  DraaiwerkBoard,
  tapDistanceThreshold,
  type BeltGhost,
} from "./draaiwerk-board";
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

/** Lift the drag preview above the finger, in screen pixels. */
const DRAG_LIFT_PX = 56;

/** The viewport point of a pointer or touch event, without trusting its type. */
function clientPointFromEvent(event: Event): { x: number; y: number } | null {
  const pointer = event as Event & { clientX?: number; clientY?: number };
  if (typeof pointer.clientX === "number" && typeof pointer.clientY === "number") {
    return { x: pointer.clientX, y: pointer.clientY };
  }
  const touches = (event as Event & { changedTouches?: TouchList }).changedTouches;
  const touch = touches?.[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : null;
}

export function DraaiwerkPlay({ onLevels, onNext, hasNext, celebrate }: DraaiwerkPlayProps) {
  const level = useDraaiwerkStore((state) => state.level);
  const placements = useDraaiwerkStore((state) => state.placements);
  const pendingGearKey = useDraaiwerkStore((state) => state.pendingGearKey);
  const hintPlacement = useDraaiwerkStore((state) => state.hintPlacement);
  const [activeTrayId, setActiveTrayId] = useState<string | null>(null);
  const [activePlacedKey, setActivePlacedKey] = useState<string | null>(null);
  const [ghost, setGhost] = useState<BeltGhost | null>(null);
  const [settling, setSettling] = useState<BeltGhost | null>(null);
  const boardRef = useRef<SVGSVGElement | null>(null);
  const ghostRef = useRef<BeltGhost | null>(null);
  const ghostOrigin = useRef<{ x: number; y: number } | null>(null);
  const settleControls = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => settleControls.current?.stop(), []);

  const result = useMemo(() => drive(level, placements), [level, placements]);
  const selectedItem = useSelectedTrayItem();
  const activeItem: TrayItem | null = activeTrayId
    ? (level.tray.find((item) => item.id === activeTrayId) ?? null)
    : null;
  const canMovePlaced = !selectedItem && !activeTrayId && !result.solved;
  // Only the chain token and the loose-chain ghost are lifted. A gear token
  // stays under the finger, otherwise a lift of two hole rows would place it
  // on the wrong hole.
  const liftDragToken =
    activeItem?.kind === "belt" ||
    activeItem?.kind === "chain" ||
    Boolean(activePlacedKey?.startsWith("loose:")) ||
    Boolean(activePlacedKey?.startsWith("belt:"));

  // A short press is a tap, a longer movement is a drag. The same threshold
  // also drives the sensors, which replaces the old wasDragging booleans.
  const dragThreshold = useMemo(() => tapDistanceThreshold(), []);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: dragThreshold } }),
    useSensor(TouchSensor, { activationConstraint: { distance: dragThreshold } }),
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
      const pointer = args.pointerCoordinates;
      if (pointer) {
        // The chain token and the loose-chain ghost are drawn above the finger,
        // so their drop target moves up with them. A gear stays under the
        // finger; lifting it would shift it by two hole rows.
        const lift = liftDragToken ? DRAG_LIFT_PX : 0;
        const pickAt = (x: number, y: number) => {
          const candidates: Array<{
            container: (typeof args.droppableContainers)[number];
            distance: number;
            inside: boolean;
          }> = [];
          for (const container of args.droppableContainers) {
            if (!allowed(container)) {
              continue;
            }
            const rect = args.droppableRects.get(container.id);
            if (!rect) {
              continue;
            }
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(x - centerX, y - centerY);
            const withinRect =
              x >= rect.left &&
              x <= rect.left + rect.width &&
              y >= rect.top &&
              y <= rect.top + rect.height;
            const inside = withinRect || distance <= Math.min(rect.width, rect.height) / 2 + 16;
            if (!inside && distance > 72) {
              continue;
            }
            candidates.push({ container, distance, inside });
          }
          candidates.sort((a, b) => Number(b.inside) - Number(a.inside) || a.distance - b.distance);
          return candidates[0]?.inside ? candidates[0].container : null;
        };

        const liftedTarget = lift > 0 ? pickAt(pointer.x, pointer.y - lift) : null;
        const target = liftedTarget ?? pickAt(pointer.x, pointer.y);
        if (target) {
          return [{ id: target.id, data: { droppableContainer: target, value: 1 } }];
        }
        return [];
      }
      if (underPointer.length > 0) {
        return underPointer;
      }
      return closestCenter(args).filter(allowed);
    },
    [activeItem, activePlacedKey, liftDragToken],
  );

  const startBeltGhost = (holeId: string, activator: Event) => {
    const placement = placements.find(
      (candidate) => candidate.kind === "loose-belt" && candidate.holeId === holeId,
    );
    const anchor = result.gears.find((pose) => pose.holeId === holeId);
    const origin = clientPointFromEvent(activator);
    if (!placement || placement.kind !== "loose-belt" || !anchor || !origin) {
      return;
    }
    const point = boardPointFromClient(boardRef.current, level, origin.x, origin.y - DRAG_LIFT_PX);
    if (!point) {
      return;
    }
    const drag: BeltGhost = { anchorKey: anchor.key, link: placement.link, point };
    ghostOrigin.current = origin;
    ghostRef.current = drag;
    setGhost(drag);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    ghostOrigin.current = null;
    ghostRef.current = null;
    setGhost(null);

    if (id.startsWith("tray:")) {
      setActiveTrayId(id.slice("tray:".length));
    } else if (id.startsWith("placed:")) {
      const placedKey = id.slice("placed:".length);
      setActivePlacedKey(placedKey);
      if (placedKey.startsWith("loose:")) {
        startBeltGhost(placedKey.slice("loose:".length), event.activatorEvent);
      }
    } else {
      return;
    }
    playSound("tap");
    playHaptic("tap");
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const drag = ghostRef.current;
    const origin = ghostOrigin.current;
    if (!drag || !origin) {
      return;
    }
    const point = boardPointFromClient(
      boardRef.current,
      level,
      origin.x + event.delta.x,
      origin.y + event.delta.y - DRAG_LIFT_PX,
    );
    if (!point) {
      return;
    }
    const next: BeltGhost = { ...drag, point };
    ghostRef.current = next;
    setGhost(next);
  };

  const settleBelt = (drag: BeltGhost, anchorHoleId: string, target: GearPose) => {
    settleControls.current?.stop();
    const from = drag.point;
    const to = target.center;
    setSettling({ ...drag, locked: true });

    settleControls.current = animate(0, 1, {
      duration: 0.18,
      ease: "easeOut",
      onUpdate: (progress) => {
        setSettling((current) =>
          current
            ? {
                ...current,
                point: {
                  x: from.x + (to.x - from.x) * progress,
                  y: from.y + (to.y - from.y) * progress,
                },
              }
            : current,
        );
      },
      onComplete: () => {
        settleControls.current = null;
        playSound("ratchet");
        playHaptic("select");
        setSettling(null);
        useDraaiwerkStore.getState().extendLooseBelt(anchorHoleId, target.key);
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const over = event.over ? String(event.over.id) : null;
    const placedKey = activePlacedKey;
    const trayId = trayIdFromActive(event.active.id);
    const beltGhost = ghostRef.current;
    ghostOrigin.current = null;
    ghostRef.current = null;
    setGhost(null);
    setActiveTrayId(null);
    setActivePlacedKey(null);

    if (placedKey?.startsWith("loose:")) {
      const anchorHoleId = placedKey.slice("loose:".length);
      if (over === "tray-remove") {
        useDraaiwerkStore.getState().removePlaced(placedKey);
        return;
      }
      const target = beltGhost
        ? looseBeltTarget(
            level,
            placements,
            result.gears,
            anchorHoleId,
            beltGhost.link,
            beltGhost.point,
          )
        : null;
      if (beltGhost && target?.snapped) {
        settleBelt(beltGhost, anchorHoleId, target.pose);
        return;
      }
      if (over?.startsWith("gear:")) {
        useDraaiwerkStore.getState().extendLooseBelt(anchorHoleId, over.slice("gear:".length));
      }
      return;
    }

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
      // The belt itself is the ghost on the board; no tray token is needed.
      return null;
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

  // A loose belt drags as a real band on the board, not as a token from the tray.
  const overlayItem =
    activeItem ?? (activePlacedKey?.startsWith("loose:") ? null : activePlacedItem);

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
          ghostOrigin.current = null;
          ghostRef.current = null;
          setGhost(null);
          setActiveTrayId(null);
          setActivePlacedKey(null);
        }}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
      >
        <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-1 md:portrait:grid-rows-[minmax(0,1fr)_auto] md:landscape:grid-cols-7">
          <DraaiwerkBoard
            canMovePlaced={canMovePlaced}
            ghost={settling ?? ghost}
            hintPlacement={hintPlacement}
            level={level}
            pendingGearKey={pendingGearKey}
            placements={placements}
            result={result}
            selectedItem={selectedItem}
            svgRef={boardRef}
            onGear={(key) => useDraaiwerkStore.getState().tapGear(key)}
            onHole={(holeId) => useDraaiwerkStore.getState().tapHole(holeId)}
            onLoose={(holeId) => useDraaiwerkStore.getState().selectLooseBelt(holeId)}
            onToggleBelt={(key) => useDraaiwerkStore.getState().toggleBeltKind(key)}
          />
          <DraaiwerkTray removing={Boolean(activePlacedKey)} />
        </div>

        <DragOverlay dropAnimation={null}>
          {overlayItem ? (
            <div
              className="draaiwerk-drag-token flex h-full w-full items-center justify-center"
              data-lift={liftDragToken ? "true" : "false"}
            >
              <TrayArt item={overlayItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
