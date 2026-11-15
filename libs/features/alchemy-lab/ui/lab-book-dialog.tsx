import { useState } from "react";
import { m } from "motion/react";
import { ELEMENTS, getElement, type AlchemyElement, type ElementId } from "@entities/alchemy";
import { Button, X } from "@shared/ui";
import { filterAndSortElements, type CategoryFilter, type ElementSort } from "../model/filters";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { ElementDetail } from "./element-detail";
import { ElementFilters } from "./element-filters";
import { ElementToken } from "./element-token";

interface LabBookDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LabBookDialog({ open, onClose }: LabBookDialogProps) {
  const discovered = useAlchemyStore((state) => state.discovered);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<ElementSort>("new");
  const [selectedId, setSelectedId] = useState<ElementId | null>(null);

  if (!open) {
    return null;
  }

  const found = new Set(discovered);
  const orderedElements = [
    ...discovered
      .map((id) => getElement(id))
      .filter((element): element is AlchemyElement => element !== undefined),
    ...ELEMENTS.filter((element) => !found.has(element.id)),
  ];
  const visibleElements = filterAndSortElements(orderedElements, category, sort);
  const selectedElement = selectedId ? getElement(selectedId) : undefined;
  const progress = Math.round((discovered.length / ELEMENTS.length) * 100);

  const close = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <div
      aria-labelledby="lab-book-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      onClick={close}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <m.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-card p-4 shadow-xl sm:p-6"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ damping: 28, stiffness: 340, type: "spring" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black" id="lab-book-title">
              Labboek
            </h2>
            <p className="text-sm text-muted-foreground">
              {discovered.length} van {ELEMENTS.length} elementen ontdekt
            </p>
          </div>
          <Button aria-label="Sluit labboek" size="icon" variant="ghost" onClick={close}>
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <m.div
            animate={{ scaleX: progress / 100 }}
            className="h-full w-full origin-left rounded-full bg-primary"
            initial={{ scaleX: 0 }}
            transition={{ damping: 26, stiffness: 120, type: "spring" }}
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">Iconen: Microsoft Fluent Emoji · MIT</p>

        {selectedElement ? (
          <div className="mt-4">
            <ElementDetail
              discovered={found}
              element={selectedElement}
              onBack={() => setSelectedId(null)}
            />
          </div>
        ) : (
          <>
            <div className="mt-3">
              <ElementFilters
                category={category}
                sort={sort}
                onCategoryChange={setCategory}
                onSortChange={setSort}
              />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {visibleElements.map((element) =>
                found.has(element.id) ? (
                  <button
                    key={element.id}
                    aria-label={`Bekijk ${element.name}`}
                    className="flex justify-center rounded-2xl p-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                    type="button"
                    onClick={() => setSelectedId(element.id)}
                  >
                    <ElementToken element={element} />
                  </button>
                ) : (
                  <div key={element.id} className="flex flex-col items-center gap-1">
                    <ElementToken element={element} undiscovered />
                    <span className="text-xs font-bold text-muted-foreground">Onbekend</span>
                  </div>
                ),
              )}
            </div>

            {visibleElements.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Geen elementen in deze categorie.
              </p>
            ) : null}

            <Button className="mt-5 w-full" size="lg" onClick={close}>
              Terug naar de werkbank
            </Button>
          </>
        )}
      </m.div>
    </div>
  );
}
