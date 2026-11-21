import { gameCatalog } from "@entities/game";
import { GameMenu } from "@widgets/game-menu";
import { Badge } from "@shared/ui";

export function HomePage() {
  const availableCount = gameCatalog.filter((game) => game.status === "available").length;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-5 pb-12 pt-safe sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-normal tracking-tight sm:text-5xl">Spellen</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Rustige spelletjes om te puzzelen, rekenen, lezen en samen te spelen.
          </p>
        </div>
        <Badge tone="neutral">{availableCount} spellen</Badge>
      </header>

      <GameMenu />
    </main>
  );
}
