import { useState } from "react";
import { GAME_CATEGORIES, gameCatalog, type GameCategory } from "@entities/game";
import { GameMenu } from "@widgets/game-menu";
import { Badge, Button } from "@shared/ui";

type FilterValue = GameCategory | "all";

export function HomePage() {
  const [category, setCategory] = useState<FilterValue>("all");
  const availableCount = gameCatalog.filter((game) => game.status === "available").length;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-5 pb-12 pt-safe sm:px-8">
      <header className="space-y-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-normal tracking-tight sm:text-5xl">
              Spellen
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Rustige spelletjes om te puzzelen, rekenen, lezen en samen te spelen.
            </p>
          </div>
          <Badge tone="primary">{availableCount} spellen</Badge>
        </div>

        <nav aria-label="Filter spellen op soort" className="flex flex-wrap gap-2">
          <Button
            aria-pressed={category === "all"}
            size="sm"
            variant={category === "all" ? "default" : "outline"}
            onClick={() => setCategory("all")}
          >
            Alles
          </Button>
          {GAME_CATEGORIES.map((item) => (
            <Button
              key={item.id}
              aria-pressed={category === item.id}
              size="sm"
              variant={category === item.id ? "default" : "outline"}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </header>

      <GameMenu category={category} />
    </main>
  );
}
