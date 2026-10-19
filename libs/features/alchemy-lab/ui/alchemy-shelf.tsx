import { useEffect, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ELEMENTS, getElement, type AlchemyElement } from "@entities/alchemy";
import { cn } from "@shared/lib";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { shelfItemId } from "./dnd-ids";
import { ElementToken } from "./element-token";

function ShelfToken({ element }: { element: AlchemyElement }) {
  const board = useAlchemyStore((state) => state.board);
  const selected = useAlchemyStore((state) => state.selected);
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: shelfItemId(element.id),
  });
  const wasDragging = useRef(false);
  const dndPointerDown = listeners?.onPointerDown;

  useEffect(() => {
    if (isDragging) {
      wasDragging.current = true;
    }
  }, [isDragging]);

  const handleClick = () => {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    if (selected && board.some((item) => item.instanceId === selected)) {
      useAlchemyStore.getState().combineWithBoard(element.id, selected);
      return;
    }
    useAlchemyStore.getState().addToBoard(element.id);
  };

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${element.name} op de werkbank leggen`}
      className={cn(
        "touch-none rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        isDragging && "opacity-30",
      )}
      type="button"
      onClick={handleClick}
      onPointerDown={(event) => {
        wasDragging.current = false;
        dndPointerDown?.(event);
      }}
    >
      <ElementToken element={element} />
    </button>
  );
}

export function AlchemyShelf() {
  const discovered = useAlchemyStore((state) => state.discovered);
  const selected = useAlchemyStore((state) => state.selected);
  const elements = discovered
    .map((id) => getElement(id))
    .filter((element): element is AlchemyElement => element !== undefined);

  return (
    <section
      aria-label="Mijn elementen"
      className="rounded-3xl border bg-card p-3 shadow-sm sm:p-4"
    >
      <div className="mb-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Mijn elementen
        </h2>
        <p className="text-sm font-bold">
          {elements.length} van {ELEMENTS.length} ontdekt
        </p>
        <p className="text-xs text-muted-foreground">
          {selected ? "Kies een tweede element om te mengen" : "Tik om op de werkbank te leggen"}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 sm:gap-2">
        {elements.map((element) => (
          <ShelfToken key={element.id} element={element} />
        ))}
      </div>
    </section>
  );
}
