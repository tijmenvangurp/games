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
import { Button, Check, Panel, RotateCcw, Sparkles } from "@shared/ui";
import { createSortRound, type SortWord } from "../model/sort";
import { SortCategoryBox, SortWordBank } from "./french-category-sort-parts";
import { useTexts } from "@shared/i18n";
import { frenchTexts } from "./texts";

interface FrenchCategorySortProps {
  lessons: readonly FrenchLesson[];
}

export function FrenchCategorySort({ lessons }: FrenchCategorySortProps) {
  const [seed, setSeed] = useState(createSeed);
  const t = useTexts(frenchTexts);
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
      <Panel className="flex items-center justify-between gap-3 px-4 py-3" padding="none">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t.progress}</p>
          <p className="text-sm font-bold tabular-nums">
            {t.placed(round.words.length - unplaced.length, round.words.length)}
          </p>
        </div>
        <div className="text-right tabular-nums">
          <p className="text-2xl font-black leading-none">{score}</p>
          <p className="text-xs text-muted-foreground">{t.correctLabel}</p>
        </div>
      </Panel>

      <p className="text-center text-sm text-muted-foreground">{t.sortHint}</p>

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
        <SortResult score={score} total={round.words.length} onRestart={restart} />
      ) : (
        <Button className="w-full" disabled={!allPlaced} size="lg" onClick={check}>
          <Check aria-hidden="true" className="size-5" />
          {t.check}
        </Button>
      )}
    </div>
  );
}

interface SortResultProps {
  score: number;
  total: number;
  onRestart: () => void;
}

/** De uitslag na het controleren, met een knop voor een nieuwe ronde. */
function SortResult({ score, total, onRestart }: SortResultProps) {
  const t = useTexts(frenchTexts);
  const perfect = score === total;

  return (
    <Panel aria-live="polite" className="space-y-2" padding="md">
      <p
        className={
          perfect
            ? "flex items-center justify-center gap-1.5 font-bold text-success-ink"
            : "flex items-center justify-center gap-1.5 font-bold text-warning-ink"
        }
      >
        <Sparkles aria-hidden="true" className="size-5" />
        {perfect ? t.allCorrect : t.notYet}
      </p>
      <p className="text-center text-sm tabular-nums text-muted-foreground">
        {t.scored(score, total)}
      </p>
      <Button className="w-full" size="lg" onClick={onRestart}>
        <RotateCcw aria-hidden="true" className="size-5" />
        {t.newRound}
      </Button>
    </Panel>
  );
}
