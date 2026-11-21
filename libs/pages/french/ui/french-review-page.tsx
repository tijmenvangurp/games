import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  allFrenchItems,
  dueItemIds,
  localizeItem,
  type FrenchItem,
  type FrenchLesson,
} from "@entities/french";
import { FrenchQuiz, useFrenchProgressStore, useFrenchQuizStore } from "@features/french-listening";
import { useLanguage, useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { Button, Panel, Play, RotateCcw } from "@shared/ui";
import { frenchPageTexts } from "./texts";

type PageTexts = (typeof frenchPageTexts)["nl"];

function createReviewLesson(t: PageTexts, items: readonly FrenchItem[]): FrenchLesson {
  return {
    id: "review",
    title: t.reviewTitle,
    subtitle: t.reviewLessonSubtitle,
    category: t.reviewTitle,
    emoji: "🔁",
    level: "A1.2",
    status: "reviewed",
    items,
  };
}

export function FrenchReviewPage() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = useTexts(frenchPageTexts);
  const progress = useFrenchProgressStore((state) => state.progress);
  const [reviewItems, setReviewItems] = useState<readonly FrenchItem[] | null>(null);
  const allItems = allFrenchItems().map((item) => localizeItem(item, language));
  const dueItems = dueItemIds(progress, allItems)
    .map((id) => allItems.find((item) => item.id === id))
    .filter((item): item is FrenchItem => Boolean(item));

  const start = () => {
    const items = [...dueItems];
    setReviewItems(items);
    useFrenchQuizStore.getState().start(createReviewLesson(t, items), allItems);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/frans" })}
      showSpeech={false}
      subtitle={t.reviewSubtitle}
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
          <h2 className="font-display text-2xl">{t.reviewTitle}</h2>
          <p className="text-muted-foreground">
            {dueItems.length > 0 ? t.reviewReady(dueItems.length) : t.nothingToReview}
          </p>
          {dueItems.length > 0 ? (
            <Button size="lg" onClick={start}>
              <Play aria-hidden="true" className="size-5" />
              {t.startReview}
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={() => navigate({ to: "/frans" })}>
              {t.backToLessons}
            </Button>
          )}
        </Panel>
      )}
    </GameShell>
  );
}
