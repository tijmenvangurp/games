import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
  const [activeWord, setActiveWord] = useState<SortWord | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const unplaced = round.words.filter((word) => !placements[word.item.id]);
  const selectedWord = round.words.find((word) => word.item.id === selectedId);
  const allPlaced = unplaced.length === 0;
  const score = checked
    ? round.words.filter((word) => placements[word.item.id] === word.lessonId).length
    : 0;

  const placeWord = (word: SortWord, categoryId: string) => {
    if (checked) {
      return;
    }
    setPlacements((current) => ({ ...current, [word.item.id]: categoryId }));
    setSelectedId(null);
  };

  const placeSelected = (categoryId: string) => {
    if (selectedWord) {
      placeWord(selectedWord, categoryId);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const word = round.words.find((candidate) => candidate.item.id === String(event.active.id));
    setActiveWord(word ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const word = round.words.find((candidate) => candidate.item.id === String(event.active.id));
    const categoryId = event.over ? String(event.over.id) : null;
    if (word && categoryId) {
      placeWord(word, categoryId);
    }
    setActiveWord(null);
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
    if (correct === round.words.length) {
      playSound("match");
    }
  };

  const restart = () => {
    setSeed(createSeed());
    setSelectedId(null);
    setPlacements({});
    setChecked(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="game-panel flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Voortgang
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
        Sleep een woord naar een categorie, of tik het woord en daarna de categorie.
      </p>

      <DndContext
        collisionDetection={pointerWithin}
        sensors={sensors}
        onDragCancel={() => setActiveWord(null)}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
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
              onPlace={placeSelected}
              onRemove={remove}
            />
          ))}
        </div>

        <DragOverlay>
          {activeWord ? (
            <div className="rounded-xl border border-primary bg-card px-3 py-2 font-bold shadow-lg">
              {activeWord.item.fr}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {checked ? (
        <div aria-live="polite" className="game-panel space-y-2 p-4">
          <p
            className={
              score === round.words.length
                ? "flex items-center justify-center gap-1.5 font-black text-success"
                : "flex items-center justify-center gap-1.5 font-black text-warning"
            }
          >
            <Sparkles aria-hidden="true" className="size-5" />
            {score === round.words.length ? "Alles goed!" : "Nog niet."}
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
