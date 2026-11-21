import { useNavigate } from "@tanstack/react-router";
import { listPublishedLessons, localizeLesson } from "@entities/french";
import { FrenchCategorySort } from "@features/french-listening";
import { useLanguage, useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { frenchPageTexts } from "./texts";

export function FrenchSortPage() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = useTexts(frenchPageTexts);
  const lessons = listPublishedLessons().map((lesson) => localizeLesson(lesson, language));

  return (
    <GameShell
      onBack={() => navigate({ to: "/frans" })}
      showSpeech={false}
      subtitle={t.sortSubtitle}
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      <FrenchCategorySort lessons={lessons} />
    </GameShell>
  );
}
