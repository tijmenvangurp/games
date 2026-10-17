import { Link } from "@tanstack/react-router";
import { gameCatalog } from "@entities/game";
import { Play } from "@shared/ui";
import { cn } from "@shared/lib";

export function GameMenu() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {gameCatalog.map((game) =>
        game.status === "available" ? (
          <Link
            key={game.id}
            className={cn(
              "group flex min-h-40 flex-col rounded-3xl border bg-gradient-to-br p-5 shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
              game.accentClassName,
            )}
            to="/sudoku"
          >
            <div className="flex items-start justify-between">
              <span aria-hidden="true" className="text-4xl">
                {game.emoji}
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-white/80 text-primary shadow-sm transition group-hover:bg-white">
                <Play aria-hidden="true" className="size-4" />
              </span>
            </div>
            <h2 className="mt-3 text-lg font-black">{game.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{game.description}</p>
            <span className="mt-auto pt-4 text-sm font-bold text-primary">Spelen</span>
          </Link>
        ) : (
          <div
            key={game.id}
            aria-disabled="true"
            className="flex min-h-40 flex-col rounded-3xl border border-dashed bg-card/60 p-5 text-muted-foreground"
          >
            <div className="flex items-start justify-between">
              <span aria-hidden="true" className="text-4xl opacity-60">
                {game.emoji}
              </span>
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-bold uppercase tracking-wide">
                Binnenkort
              </span>
            </div>
            <h2 className="mt-3 text-lg font-black">{game.name}</h2>
            <p className="mt-1 text-sm">{game.description}</p>
          </div>
        ),
      )}
    </div>
  );
}
