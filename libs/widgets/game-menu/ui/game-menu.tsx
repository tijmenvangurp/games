import { Link } from "@tanstack/react-router";
import { gameCatalog } from "@entities/game";
import { cn } from "@shared/lib";

export function GameMenu() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {gameCatalog.map((game, index) =>
        game.status === "available" ? (
          <Link
            key={game.id}
            className={cn(
              "game-card group flex min-h-40 flex-col bg-gradient-to-br p-5 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 active:translate-y-0",
              game.accentClassName,
            )}
            to={game.to}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-display text-xs tracking-[0.2em] text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden="true" className="text-3xl leading-none">
                {game.emoji}
              </span>
            </div>
            <h2 className="mt-3 font-display text-2xl leading-snug">{game.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {game.description}
            </p>
            <span className="mt-auto pt-4 font-display text-sm italic text-primary">Openen →</span>
          </Link>
        ) : (
          <div
            key={game.id}
            aria-disabled="true"
            className="game-card flex min-h-40 flex-col border-dashed bg-card/70 p-5 text-muted-foreground"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-display text-xs tracking-[0.2em]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden="true" className="text-3xl leading-none opacity-60">
                {game.emoji}
              </span>
            </div>
            <h2 className="mt-3 font-display text-2xl leading-snug">{game.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed">{game.description}</p>
            <span className="mt-auto pt-4 font-display text-sm italic">Binnenkort</span>
          </div>
        ),
      )}
    </div>
  );
}
