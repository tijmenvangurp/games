import { useState } from "react";
import {
  ELEMENTS,
  elementName,
  getElement,
  type AlchemyElement,
  type ElementId,
} from "@entities/alchemy";
import { useLanguage, useTexts } from "@shared/i18n";
import { Button, Dialog, ProgressBar, X } from "@shared/ui";
import { filterAndSortElements, type CategoryFilter, type ElementSort } from "../model/filters";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { ElementDetail } from "./element-detail";
import { ElementFilters } from "./element-filters";
import { ElementToken } from "./element-token";
import { alchemyTexts } from "./texts";

interface LabBookDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LabBookDialog({ open, onClose }: LabBookDialogProps) {
  const discovered = useAlchemyStore((state) => state.discovered);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<ElementSort>("new");
  const [selectedId, setSelectedId] = useState<ElementId | null>(null);
  const language = useLanguage();
  const t = useTexts(alchemyTexts);

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
  const visibleElements = filterAndSortElements(orderedElements, category, sort, language);
  const selectedElement = selectedId ? getElement(selectedId) : undefined;

  const close = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <Dialog dismissOnBackdrop labelledBy="lab-book-title" size="lg" onClose={close}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight" id="lab-book-title">
            {t.labBook}
          </h2>
          <p className="text-sm tabular-nums text-muted-foreground">
            {t.discoveredCount(discovered.length, ELEMENTS.length)}
          </p>
        </div>
        <Button aria-label={t.closeLabBook} size="icon" variant="ghost" onClick={close}>
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>

      <ProgressBar
        className="mt-3"
        label={t.discoveredCount(discovered.length, ELEMENTS.length)}
        max={ELEMENTS.length}
        size="md"
        value={discovered.length}
      />

      <p className="mt-2 text-xs text-muted-foreground">{t.iconCredit}</p>

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
                  aria-label={t.view(elementName(element.id, language))}
                  className="flex justify-center rounded-xl p-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                  type="button"
                  onClick={() => setSelectedId(element.id)}
                >
                  <ElementToken element={element} />
                </button>
              ) : (
                <div key={element.id} className="flex flex-col items-center gap-1">
                  <ElementToken element={element} undiscovered />
                  <span className="text-xs font-bold text-muted-foreground">{t.unknown}</span>
                </div>
              ),
            )}
          </div>

          {visibleElements.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t.noneInCategory}</p>
          ) : null}

          <Button className="mt-5 w-full" size="lg" onClick={close}>
            {t.backToWorkbench}
          </Button>
        </>
      )}
    </Dialog>
  );
}
