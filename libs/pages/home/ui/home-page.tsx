import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GAME_CATEGORIES, gameCatalog, type GameCategory } from "@entities/game";
import { GameMenu } from "@widgets/game-menu";
import { Button, Dices } from "@shared/ui";

type FilterValue = GameCategory | "all";

export function HomePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<FilterValue>("all");

  const openRandomGame = () => {
    const pool = gameCatalog.filter(
      (game) => game.status === "available" && (category === "all" || game.category === category),
    );
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick && pick.status === "available") {
      void navigate({ to: pick.to });
    }
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-5 pb-12 pt-safe sm:px-8">
      <header className="space-y-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-4xl font-normal tracking-tight sm:text-5xl">
              Spellen
            </h1>
            <span aria-hidden="true" className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-pawn-blue" />
              <span className="size-2.5 rounded-full bg-pawn-orange" />
              <span className="size-2.5 rounded-full bg-pawn-green" />
              <span className="size-2.5 rounded-full bg-pawn-pink" />
            </span>
          </div>

          <Button size="sm" variant="soft" onClick={openRandomGame}>
            <Dices aria-hidden="true" className="size-4" />
            Verras me!
          </Button>
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
