import { useId } from "react";
import { categoryLabel } from "@entities/alchemy";
import { useLanguage, useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import {
  CATEGORY_FILTERS,
  ELEMENT_SORTS,
  type CategoryFilter,
  type ElementSort,
} from "../model/filters";
import { alchemyTexts } from "./texts";

interface ElementFiltersProps {
  category: CategoryFilter;
  sort: ElementSort;
  onCategoryChange: (category: CategoryFilter) => void;
  onSortChange: (sort: ElementSort) => void;
}

export function ElementFilters({
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: ElementFiltersProps) {
  const sortId = useId();
  const language = useLanguage();
  const t = useTexts(alchemyTexts);
  const filterLabel = (value: CategoryFilter) =>
    value === "all" ? t.allCategories : categoryLabel(value, language);

  return (
    <div className="flex flex-col gap-2">
      <div aria-label={t.filterByCategory} className="flex flex-wrap gap-1.5" role="group">
        {CATEGORY_FILTERS.map((value) => (
          <button
            key={value}
            aria-pressed={category === value}
            className={cn(
              "min-h-11 rounded-full border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
              category === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
            type="button"
            onClick={() => onCategoryChange(value)}
          >
            {filterLabel(value)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 md:portrait:hidden">
        <label className="text-xs font-bold text-muted-foreground" htmlFor={sortId}>
          {t.sort}
        </label>
        <select
          className="h-11 rounded-xl border bg-card px-2 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          id={sortId}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ElementSort)}
        >
          {ELEMENT_SORTS.map((value) => (
            <option key={value} value={value}>
              {t.sortLabels[value]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
