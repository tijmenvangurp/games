import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ELEMENTS, getElement, type AlchemyElement } from "@entities/alchemy";
import { GripVertical } from "@shared/ui";
import { cn } from "@shared/lib";
import { filterAndSortElements, type CategoryFilter, type ElementSort } from "../model/filters";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { shelfHandleItemId, shelfItemId } from "./dnd-ids";
import { ElementFilters } from "./element-filters";
import { ElementToken } from "./element-token";

function ShelfToken({ element }: { element: AlchemyElement }) {
  const board = useAlchemyStore((state) => state.board);
  const selected = useAlchemyStore((state) => state.selected);
  const tileDrag = useDraggable({ id: shelfItemId(element.id) });
  const handleDrag = useDraggable({ id: shelfHandleItemId(element.id) });
  const tileWasDragging = useRef(false);
  const handleWasDragging = useRef(false);

  useEffect(() => {
    if (tileDrag.isDragging) {
      tileWasDragging.current = true;
    }
  }, [tileDrag.isDragging]);

  useEffect(() => {
    if (handleDrag.isDragging) {
      handleWasDragging.current = true;
    }
  }, [handleDrag.isDragging]);

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

  const handleHandleClick = () => {
    if (handleWasDragging.current) {
      handleWasDragging.current = false;
      return;
    }
    activate();
  };

  const dragging = tileDrag.isDragging || handleDrag.isDragging;

  // The tile keeps pan-y so the shelf and page stay scrollable. The grip has
  // touch-none, so a vertical drag on a phone starts the touch sensor.
  return (
    <div className="relative">
      <button
        ref={tileDrag.setNodeRef}
        {...tileDrag.attributes}
        {...tileDrag.listeners}
        aria-label={`${element.name} op de werkbank leggen`}
        className={cn(
          "touch-pan-y rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
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

      <button
        ref={handleDrag.setNodeRef}
        {...handleDrag.attributes}
        {...handleDrag.listeners}
        aria-label={`Sleep ${element.name}`}
        className="absolute -right-1 -top-1 z-10 grid size-11 touch-none place-items-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        title={`Sleep ${element.name} naar de werkbank`}
        type="button"
        onClick={handleHandleClick}
        onPointerDown={(event) => {
          handleWasDragging.current = false;
          handleDrag.listeners?.onPointerDown?.(event);
        }}
      >
        <span className="grid size-6 place-items-center rounded-full bg-card/95 text-muted-foreground shadow-sm ring-1 ring-border">
          <GripVertical aria-hidden="true" className="size-3.5" />
        </span>
      </button>
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
      className="flex min-h-0 flex-col rounded-3xl border bg-card p-3 shadow-sm sm:p-4 lg:col-span-2 lg:h-full lg:overflow-hidden"
    >
      <div className="mb-2 shrink-0">
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

      <div
        className="min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
        data-alchemy-shelf-scroll="true"
      >
        {visibleElements.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nog geen elementen in deze categorie.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 sm:gap-2 lg:grid-cols-5 lg:gap-1.5 xl:gap-2">
            {visibleElements.map((element) => (
              <ShelfToken key={element.id} element={element} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
