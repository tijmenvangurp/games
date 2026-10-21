import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ELEMENTS, getElement, type AlchemyElement } from "@entities/alchemy";
import { cn } from "@shared/lib";
import { filterAndSortElements, type CategoryFilter, type ElementSort } from "../model/filters";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { shelfItemId } from "./dnd-ids";
import { ElementFilters } from "./element-filters";
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

  // The shelf is a horizontal strip below the board on phones and tablets.
  // pan-x keeps that strip scrollable while vertical drags reach the sensor.
  // On large screens the shelf is a vertical sidebar and pan-y is the right
  // gesture for scrolling it.
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${element.name} op de werkbank leggen`}
      className={cn(
        "shrink-0 touch-pan-x rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 lg:touch-pan-y",
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
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<ElementSort>("new");
  const elements = discovered
    .map((id) => getElement(id))
    .filter((element): element is AlchemyElement => element !== undefined);
  const visibleElements = filterAndSortElements(elements, category, sort);

  return (
    <section
      aria-label="Mijn elementen"
      className="flex min-h-0 min-w-0 flex-col rounded-3xl border bg-card p-3 shadow-sm sm:p-4 lg:col-span-2 lg:h-full lg:overflow-hidden"
    >
      <div className="mb-2 shrink-0">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Mijn elementen
        </h2>
        <p className="text-sm font-bold">
          {elements.length} van {ELEMENTS.length} ontdekt
        </p>
        <p className="text-xs text-muted-foreground">
          {selected ? "Kies een tweede element om te mengen" : "Tik of sleep naar de werkbank"}
        </p>
      </div>

      {elements.length > 8 ? (
        <div className="mb-2 shrink-0">
          <ElementFilters
            category={category}
            sort={sort}
            onCategoryChange={setCategory}
            onSortChange={setSort}
          />
        </div>
      ) : null}

      <div className="relative min-h-0 min-w-0 lg:flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card to-transparent lg:hidden"
        />
        <div
          className="flex min-h-0 min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:h-full lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
          data-alchemy-shelf-scroll="true"
        >
          {visibleElements.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nog geen elementen in deze categorie.
            </p>
          ) : (
            <div className="flex shrink-0 gap-2 lg:grid lg:grid-cols-5 lg:gap-1.5 xl:gap-2">
              {visibleElements.map((element) => (
                <ShelfToken key={element.id} element={element} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
