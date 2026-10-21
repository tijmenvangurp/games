import { useEffect, useRef, type RefObject } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { getElement } from "@entities/alchemy";
import { cn } from "@shared/lib";
import { useAlchemyStore, type BoardElement } from "../model/use-alchemy-store";
import { BOARD_ID, boardItemId } from "./dnd-ids";
import { ElementToken } from "./element-token";

function BoardToken({
  item,
  selected,
  onTap,
}: {
  item: BoardElement;
  selected: boolean;
  onTap: () => void;
}) {
  const element = getElement(item.elementId);
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: boardItemId(item.instanceId),
  });
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: boardItemId(item.instanceId),
  });
  const wasDragging = useRef(false);
  const dndPointerDown = listeners?.onPointerDown;

  useEffect(() => {
    if (isDragging) {
      wasDragging.current = true;
    }
  }, [isDragging]);

  if (!element) {
    return null;
  }

  const setRefs = (node: HTMLButtonElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, zIndex: selected ? 20 : 10 }}
    >
      <button
        ref={setRefs}
        {...attributes}
        {...listeners}
        aria-label={`${element.name}${selected ? ", geselecteerd" : ""}`}
        aria-pressed={selected}
        className={cn(
          "touch-none rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          isDragging && "opacity-30",
          isOver && "bg-emerald-100/80 ring-4 ring-emerald-400/50",
        )}
        type="button"
        onClick={() => {
          if (wasDragging.current) {
            wasDragging.current = false;
            return;
          }
          onTap();
        }}
        onPointerDown={(event) => {
          wasDragging.current = false;
          dndPointerDown?.(event);
        }}
      >
        <ElementToken element={element} selected={selected} variant="board" />
      </button>
    </div>
  );
}

interface AlchemyBoardProps {
  boardRef: RefObject<HTMLDivElement | null>;
}

export function AlchemyBoard({ boardRef }: AlchemyBoardProps) {
  const board = useAlchemyStore((state) => state.board);
  const selected = useAlchemyStore((state) => state.selected);
  const { isOver, setNodeRef } = useDroppable({ id: BOARD_ID });

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    boardRef.current = node;
  };

  return (
    <div
      ref={setRefs}
      aria-label="Werkbank"
      className={cn(
        "relative min-h-72 w-full overflow-hidden rounded-3xl border-2 border-dashed bg-card/80 p-3 shadow-sm transition sm:min-h-96 md:h-full md:min-h-0 md:landscape:col-span-3",
        isOver && "border-primary bg-primary/5",
      )}
      data-alchemy-board="true"
      role="group"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {board.length === 0 ? (
        <p className="absolute inset-0 z-0 grid place-items-center px-6 text-center text-sm font-medium text-muted-foreground">
          Tik of sleep een element naar de werkbank. Kies daarna een tweede element om te mengen.
        </p>
      ) : null}

      {board.map((item) => (
        <BoardToken
          key={item.instanceId}
          item={item}
          selected={selected === item.instanceId}
          onTap={() => useAlchemyStore.getState().tapBoardElement(item.instanceId)}
        />
      ))}
    </div>
  );
}
