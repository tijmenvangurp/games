import { useState } from "react";
import type { FrenchLesson } from "@entities/french";
import { createSeed, playSound } from "@shared/lib";
import { Button, Check, RotateCcw, Sparkles } from "@shared/ui";
import { createSortRound, type SortWord } from "../model/sort";
import { SortCategoryBox, SortWordBank } from "./french-category-sort-parts";

interface FrenchCategorySortProps {
  lessons: readonly FrenchLesson[];
}

export function FrenchCategorySort({ lessons }: FrenchCategorySortProps) {
  const [seed, setSeed] = useState(createSeed);
  const round = createSortRound(lessons, seed);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const unplaced = round.words.filter((word) => !placements[word.item.id]);
  const selectedWord = round.words.find((word) => word.item.id === selectedId);
  const allPlaced = unplaced.length === 0;
  const score = checked
    ? round.words.filter((word) => placements[word.item.id] === word.lessonId).length
    : 0;

  const place = (categoryId: string) => {
    if (!selectedWord || checked) {
      return;
    }
    setPlacements((current) => ({ ...current, [selectedWord.item.id]: categoryId }));
    setSelectedId(null);
  };

  const remove = (word: SortWord) => {
    if (checked) {
      return;
    }
    setPlacements((current) => {
      const next = { ...current };
      delete next[word.item.id];
      return next;
    });
    setSelectedId(word.item.id);
  };

  const check = () => {
    if (!allPlaced) {
      return;
    }
    const correct = round.words.filter((word) => placements[word.item.id] === word.lessonId).length;
    setChecked(true);
    playSound(correct === round.words.length ? "match" : "wrong");
  };

  const restart = () => {
    setSeed(createSeed());
    setSelectedId(null);
    setPlacements({});
    setChecked(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Sorteer de woorden
          </p>
          <p className="text-sm font-bold">
            {round.words.length - unplaced.length} van {round.words.length} geplaatst
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black leading-none">{score}</p>
          <p className="text-xs text-muted-foreground">goed</p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Kies een woord en tik daarna op de juiste categorie.
      </p>

      <SortWordBank
        checked={checked}
        selectedId={selectedId}
        words={unplaced}
        onSelect={(word) => setSelectedId(word.item.id)}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {round.categories.map((category) => (
          <SortCategoryBox
            key={category.lessonId}
            category={category}
            checked={checked}
            placed={round.words.filter((word) => placements[word.item.id] === category.lessonId)}
            onPlace={place}
            onRemove={remove}
          />
        ))}
      </div>

      {checked ? (
        <div aria-live="polite" className="space-y-2 rounded-3xl border bg-card p-4 shadow-sm">
          <p
            className={
              score === round.words.length
                ? "flex items-center justify-center gap-1.5 font-black text-emerald-700"
                : "flex items-center justify-center gap-1.5 font-black text-rose-700"
            }
          >
            <Sparkles aria-hidden="true" className="size-5" />
            {score === round.words.length ? "Alles goed!" : "Bijna!"}
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Je had {score} van {round.words.length} goed.
          </p>
          <Button className="w-full" size="lg" onClick={restart}>
            <RotateCcw aria-hidden="true" className="size-5" />
            Nieuwe ronde
          </Button>
        </div>
      ) : (
        <Button className="w-full" disabled={!allPlaced} size="lg" onClick={check}>
          <Check aria-hidden="true" className="size-5" />
          Controleer
        </Button>
      )}
    </div>
  );
}
