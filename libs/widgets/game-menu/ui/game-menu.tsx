import { Link } from "@tanstack/react-router";
import { gameCatalog } from "@entities/game";
import { Play } from "@shared/ui";
import { cn } from "@shared/lib";

export function GameMenu() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gameCatalog.map((game) =>
        game.status === "available" ? (
          <Link
            key={game.id}
            className={cn(
              "game-card group flex min-h-44 flex-col bg-gradient-to-br p-5 transition duration-150 hover:-translate-y-1 hover:rotate-[-0.5deg] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35",
              game.accentClassName,
            )}
            to={game.to}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-2xl border-2 border-foreground bg-white/75 text-3xl shadow-[0_2px_0_var(--border)]"
              >
                {game.emoji}
              </span>
              <span className="grid size-10 place-items-center rounded-full border-2 border-foreground bg-card text-primary shadow-[0_3px_0_var(--border)] transition group-hover:-rotate-12 group-hover:bg-primary group-hover:text-primary-foreground">
                <Play aria-hidden="true" className="size-4" />
              </span>
            </div>
            <h2 className="mt-3 font-display text-xl font-black leading-tight">{game.name}</h2>
            <p className="mt-1 text-sm font-semibold leading-snug text-muted-foreground">
              {game.description}
            </p>
            <span className="mt-auto w-fit rounded-full border-2 border-foreground bg-card/80 px-3 py-1 text-xs font-black text-primary">
              Spelen →
            </span>
          </Link>
        ) : (
          <div
            key={game.id}
            aria-disabled="true"
            className="game-card flex min-h-44 flex-col border-dashed bg-card/70 p-5 text-muted-foreground"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-2xl border-2 border-dashed border-muted-foreground/50 text-3xl opacity-60"
              >
                {game.emoji}
              </span>
              <span className="rounded-full border-2 border-dashed border-muted-foreground/40 px-2 py-1 text-xs font-black uppercase tracking-wide">
                Binnenkort
              </span>
            </div>
            <h2 className="mt-3 font-display text-xl font-black leading-tight">{game.name}</h2>
            <p className="mt-1 text-sm font-semibold">{game.description}</p>
          </div>
        ),
      )}
    </div>
  );
}
