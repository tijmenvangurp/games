import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { type AlchemyElement } from "@entities/alchemy";
import { playHaptic, playSound } from "@shared/lib";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { AlchemyBoard } from "./alchemy-board";
import { AlchemyMessages } from "./alchemy-messages";
import { AlchemyShelf } from "./alchemy-shelf";
import { AlchemyToolbar } from "./alchemy-toolbar";
import { AlchemyMissionCard } from "./mission-card";
import { mergeCollision } from "./collision";
import { DiscoveryDialog } from "./discovery-dialog";
import { dropPosition, elementForDrag, resolveDrop, type DropAction } from "./drop-action";
import { parseActiveId } from "./dnd-ids";
import { ElementToken } from "./element-token";
import { LabBookDialog } from "./lab-book-dialog";

function applyDrop(action: DropAction): void {
  const store = useAlchemyStore.getState();
  if (action.type === "add") {
    store.addToBoard(action.elementId, action.position);
    return;
  }
  if (action.type === "combineWithBoard") {
    store.combineWithBoard(action.elementId, action.instanceId);
    return;
  }
  if (action.type === "combineBoard") {
    store.combineBoardElements(action.firstId, action.secondId);
    return;
  }
  store.moveBoardElement(action.instanceId, action.position);
}

export function AlchemyPlay() {
  const board = useAlchemyStore((state) => state.board);
  const discovered = useAlchemyStore((state) => state.discovered);
  const feedback = useAlchemyStore((state) => state.feedback);
  const hint = useAlchemyStore((state) => state.hint);
  const [activeElement, setActiveElement] = useState<AlchemyElement | null>(null);
  const [labOpen, setLabOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const drag = parseActiveId(String(event.active.id));
    if (!drag) {
      return;
    }

    setActiveElement(elementForDrag(drag, board));
    playSound("tap");
    playHaptic("tap");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveElement(null);

    const drag = parseActiveId(String(event.active.id));
    if (!drag || !event.over) {
      return;
    }

    const action = resolveDrop(drag, String(event.over.id), dropPosition(event, boardRef.current));
    if (action) {
      applyDrop(action);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1">
        <AlchemyToolbar
          boardEmpty={board.length === 0}
          discoveredCount={discovered.length}
          onClear={() => useAlchemyStore.getState().clearBoard()}
          onHint={() => useAlchemyStore.getState().showHint()}
          onOpenLabBook={() => setLabOpen(true)}
        />

        <AlchemyMissionCard />

        <DndContext
          collisionDetection={mergeCollision}
          sensors={sensors}
          onDragCancel={() => setActiveElement(null)}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-1 md:portrait:grid-rows-[minmax(0,1fr)_auto] md:landscape:grid-cols-5">
            <AlchemyBoard boardRef={boardRef} />
            <AlchemyShelf />
          </div>
          <DragOverlay dropAnimation={null}>
            {activeElement ? (
              <div className="rotate-3 scale-105 drop-shadow-2xl">
                <ElementToken element={activeElement} variant="overlay" />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <AlchemyMessages discovered={discovered} feedback={feedback} hint={hint} />
      </div>

      <DiscoveryDialog />
      <LabBookDialog open={labOpen} onClose={() => setLabOpen(false)} />
    </>
  );
}
