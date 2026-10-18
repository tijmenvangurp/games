import { useDraggable, useDroppable } from "@dnd-kit/core";
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
  const { setNodeRef, isOver } = useDroppable({
    id: category.lessonId,
    disabled: checked,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-36 flex-col rounded-lg border bg-card p-3 transition",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/20",
      )}
    >
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
                  "min-h-11 rounded-lg border px-2.5 py-1.5 text-sm font-bold transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none",
                  state === "correct" && "border-success/45 bg-success/10 text-success",
                  state === "wrong" && "border-danger/45 bg-danger/10 text-danger",
                  state === "idle" && "border-border bg-card hover:bg-muted/60",
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

function SortWordButton({
  word,
  selected,
  checked,
  onSelect,
}: {
  word: SortWord;
  selected: boolean;
  checked: boolean;
  onSelect: (word: SortWord) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: word.item.id,
    disabled: checked,
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={word.item.fr}
      aria-pressed={selected}
      className={cn(
        "min-h-11 touch-none rounded-xl border-2 px-3 py-2 font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-40",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-muted",
        isDragging && "opacity-30",
      )}
      data-sort-word={word.item.id}
      disabled={checked}
      type="button"
      onClick={() => onSelect(word)}
    >
      {word.item.fr}
    </button>
  );
}

export function SortWordBank({ words, selectedId, checked, onSelect }: WordBankProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {words.map((word) => (
        <SortWordButton
          key={word.item.id}
          checked={checked}
          selected={word.item.id === selectedId}
          word={word}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
