import { useNavigate } from "@tanstack/react-router";
import { listPublishedLessons } from "@entities/french";
import { FrenchCategorySort } from "@features/french-listening";
import { GameShell } from "@widgets/game-shell";

export function FrenchSortPage() {
  const navigate = useNavigate();

  return (
    <GameShell
      onBack={() => navigate({ to: "/frans" })}
      subtitle="Sorteren"
      title="Bonjour !"
      titleClassName="text-xl sm:text-2xl"
    >
      <FrenchCategorySort lessons={listPublishedLessons()} />
    </GameShell>
  );
}
