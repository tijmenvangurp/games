import { cn } from "@shared/lib";
import type { SortCategory, SortWord } from "../model/sort";
import { isSortCorrect } from "../model/sort";

interface CategoryBoxProps {
  category: SortCategory;
  placed: readonly SortWord[];
  checked: boolean;
  onPlace: (categoryId: string) => void;
  onRemove: (word: SortWord) => void;
}

export function SortCategoryBox({
  category,
  placed,
  checked,
  onPlace,
  onRemove,
}: CategoryBoxProps) {
  return (
    <section className="flex min-h-36 flex-col rounded-3xl border bg-card p-3 shadow-sm">
      <button
        className="min-h-11 rounded-2xl bg-muted px-3 py-2 text-sm font-black transition hover:bg-muted/70 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none"
        data-sort-category={category.lessonId}
        disabled={checked}
        type="button"
        onClick={() => onPlace(category.lessonId)}
      >
        {category.label}
      </button>
      <div className="mt-2 flex flex-wrap content-start gap-1.5">
        {placed.length === 0 ? (
          <span className="p-1 text-xs text-muted-foreground">Tik hier</span>
        ) : (
          placed.map((word) => {
            const correct = isSortCorrect(word, category.lessonId);
            const state = checked ? (correct ? "correct" : "wrong") : "idle";
            return (
              <button
                key={word.item.id}
                aria-label={`Verwijder ${word.item.fr}`}
                className={cn(
                  "min-h-11 rounded-xl border-2 px-2.5 py-1.5 text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none",
                  state === "correct" && "border-emerald-400 bg-emerald-50 text-emerald-900",
                  state === "wrong" && "border-rose-400 bg-rose-50 text-rose-900",
                  state === "idle" && "border-border bg-white hover:bg-muted",
                )}
                data-answer-state={state}
                disabled={checked}
                type="button"
                onClick={() => onRemove(word)}
              >
                {word.item.fr}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

interface WordBankProps {
  words: readonly SortWord[];
  selectedId: string | null;
  checked: boolean;
  onSelect: (word: SortWord) => void;
}

export function SortWordBank({ words, selectedId, checked, onSelect }: WordBankProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {words.map((word) => {
        const selected = word.item.id === selectedId;
        return (
          <button
            key={word.item.id}
            aria-label={word.item.fr}
            aria-pressed={selected}
            className={cn(
              "min-h-11 rounded-xl border-2 px-3 py-2 font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-40",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted",
            )}
            data-sort-word={word.item.id}
            disabled={checked}
            type="button"
            onClick={() => onSelect(word)}
          >
            {word.item.fr}
          </button>
        );
      })}
    </div>
  );
}
