import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ELEMENTS, getElement, type AlchemyElement } from "@entities/alchemy";
import { cn } from "@shared/lib";
import { filterAndSortElements, type CategoryFilter, type ElementSort } from "../model/filters";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { shelfIconItemId, shelfItemId } from "./dnd-ids";
import { ElementFilters } from "./element-filters";
import { ElementToken } from "./element-token";

function ShelfToken({ element }: { element: AlchemyElement }) {
  const board = useAlchemyStore((state) => state.board);
  const selected = useAlchemyStore((state) => state.selected);
  const tileDrag = useDraggable({ id: shelfItemId(element.id) });
  const iconDrag = useDraggable({ id: shelfIconItemId(element.id) });
  const tileWasDragging = useRef(false);
  const iconWasDragging = useRef(false);

  useEffect(() => {
    if (tileDrag.isDragging) {
      tileWasDragging.current = true;
    }
  }, [tileDrag.isDragging]);

  useEffect(() => {
    if (iconDrag.isDragging) {
      iconWasDragging.current = true;
    }
  }, [iconDrag.isDragging]);

  const activate = () => {
    if (selected && board.some((item) => item.instanceId === selected)) {
      useAlchemyStore.getState().combineWithBoard(element.id, selected);
      return;
    }
    useAlchemyStore.getState().addToBoard(element.id);
  };

  const handleTileClick = () => {
    if (tileWasDragging.current) {
      tileWasDragging.current = false;
      return;
    }
    activate();
  };

  const handleIconClick = () => {
    if (iconWasDragging.current) {
      iconWasDragging.current = false;
      return;
    }
    activate();
  };

  const dragging = tileDrag.isDragging || iconDrag.isDragging;
  const hasTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

  // The tile itself stays pan-x/pan-y so the shelf can scroll. On a touch
  // screen an invisible surface over the picture has touch-none, so dragging
  // the picture works without an extra visible handle.
  return (
    <div className="relative shrink-0">
      <button
        ref={tileDrag.setNodeRef}
        {...tileDrag.attributes}
        {...tileDrag.listeners}
        aria-label={`${element.name} op de werkbank leggen`}
        className={cn(
          "touch-pan-x rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 md:landscape:touch-pan-y",
          dragging && "opacity-30",
        )}
        type="button"
        onClick={handleTileClick}
        onPointerDown={(event) => {
          tileWasDragging.current = false;
          tileDrag.listeners?.onPointerDown?.(event);
        }}
      >
        <ElementToken element={element} />
      </button>

      {hasTouch ? (
        <div
          ref={iconDrag.setNodeRef}
          {...iconDrag.listeners}
          aria-hidden="true"
          className="absolute left-1/2 top-1 z-10 size-16 -translate-x-1/2 touch-none cursor-grab"
          data-drag-surface={element.id}
          onClick={handleIconClick}
          onPointerDown={(event) => {
            iconWasDragging.current = false;
            iconDrag.listeners?.onPointerDown?.(event);
          }}
        />
      ) : null}
    </div>
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
      className="flex min-h-0 min-w-0 flex-col rounded-3xl border bg-card p-3 shadow-sm sm:p-4 md:h-full md:overflow-hidden md:portrait:h-96 md:landscape:col-span-2"
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

      <div className="relative min-h-0 min-w-0 md:flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card to-transparent md:landscape:hidden"
        />
        <div
          className="flex min-h-0 min-w-0 max-w-full gap-2 overflow-x-auto pb-1 md:landscape:block md:landscape:h-full md:landscape:overflow-x-hidden md:landscape:overflow-y-auto md:landscape:overscroll-contain md:landscape:pr-1"
          data-alchemy-shelf-scroll="true"
        >
          {visibleElements.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nog geen elementen in deze categorie.
            </p>
          ) : (
            <div className="flex shrink-0 gap-2 md:portrait:grid md:portrait:auto-cols-max md:portrait:grid-flow-col md:portrait:grid-rows-2 md:portrait:gap-1.5 md:landscape:grid md:landscape:grid-cols-4 md:landscape:gap-1.5 xl:gap-2">
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
