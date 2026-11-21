import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { allFrenchItems, dueItemIds, type FrenchItem, type FrenchLesson } from "@entities/french";
import { FrenchQuiz, useFrenchProgressStore, useFrenchQuizStore } from "@features/french-listening";
import { GameShell } from "@widgets/game-shell";
import { Button, Panel, Play, RotateCcw } from "@shared/ui";

function createReviewLesson(items: readonly FrenchItem[]): FrenchLesson {
  return {
    id: "review",
    title: "Herhalen",
    subtitle: "Je lastige woorden en zinnen.",
    category: "Herhalen",
    emoji: "🔁",
    level: "A1.2",
    status: "reviewed",
    items,
  };
}

export function FrenchReviewPage() {
  const navigate = useNavigate();
  const progress = useFrenchProgressStore((state) => state.progress);
  const [reviewItems, setReviewItems] = useState<readonly FrenchItem[] | null>(null);
  const allItems = allFrenchItems();
  const dueItems = dueItemIds(progress, allItems)
    .map((id) => allItems.find((item) => item.id === id))
    .filter((item): item is FrenchItem => Boolean(item));

  const start = () => {
    const items = [...dueItems];
    setReviewItems(items);
    useFrenchQuizStore.getState().start(createReviewLesson(items), allItems);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/frans" })}
      showSpeech={false}
      subtitle="Je lastige woorden"
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      {reviewItems ? (
        <FrenchQuiz />
      ) : (
        <Panel
          className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center"
          padding="lg"
        >
          <span className="grid size-14 place-items-center rounded-xl bg-primary-soft text-primary">
            <RotateCcw aria-hidden="true" className="size-7" />
          </span>
          <h2 className="font-display text-2xl">Herhalen</h2>
          <p className="text-muted-foreground">
            {dueItems.length > 0
              ? `${dueItems.length} items zijn nu aan de beurt.`
              : "Er is nu niets te herhalen."}
          </p>
          {dueItems.length > 0 ? (
            <Button size="lg" onClick={start}>
              <Play aria-hidden="true" className="size-5" />
              Start herhaling
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={() => navigate({ to: "/frans" })}>
              Terug naar lessen
            </Button>
          )}
        </Panel>
      )}
    </GameShell>
  );
}
