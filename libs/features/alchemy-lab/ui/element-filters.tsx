import { useId } from "react";
import { cn } from "@shared/lib";
import {
  CATEGORY_FILTER_OPTIONS,
  SORT_OPTIONS,
  type CategoryFilter,
  type ElementSort,
} from "../model/filters";

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

  return (
    <div className="flex flex-col gap-2">
      <div aria-label="Filter op categorie" className="flex flex-wrap gap-1.5" role="group">
        {CATEGORY_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            aria-pressed={category === option.value}
            className={cn(
              "min-h-11 rounded-full border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
              category === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
            type="button"
            onClick={() => onCategoryChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 md:portrait:hidden">
        <label className="text-xs font-bold text-muted-foreground" htmlFor={sortId}>
          Sorteer
        </label>
        <select
          className="h-11 rounded-xl border bg-card px-2 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          id={sortId}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ElementSort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
