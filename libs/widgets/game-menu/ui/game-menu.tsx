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
              "game-card group relative flex min-h-44 flex-col overflow-hidden bg-gradient-to-br p-5 transition duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/45 active:translate-y-0 active:scale-[0.98]",
              game.accentClassName,
            )}
            to={game.to}
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
            <div className="flex items-start justify-between gap-2">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/5 text-3xl shadow-[inset_0_1px_0_rgb(255_255_255_/_0.16)]"
              >
                {game.emoji}
              </span>
              <span className="grid size-10 place-items-center rounded-full border border-primary/45 bg-primary/10 text-primary shadow-[0_0_22px_-6px_var(--primary)] transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Play aria-hidden="true" className="size-4" />
              </span>
            </div>
            <h2 className="mt-3 font-display text-lg font-black uppercase leading-tight tracking-wide text-white">
              {game.name}
            </h2>
            <p className="mt-1 text-sm font-medium leading-snug text-muted-foreground">
              {game.description}
            </p>
            <span className="mt-auto pt-4 font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-300">
              Play →
            </span>
          </Link>
        ) : (
          <div
            key={game.id}
            aria-disabled="true"
            className="game-card flex min-h-44 flex-col border-dashed p-5 text-muted-foreground"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-2xl border border-dashed border-white/20 text-3xl opacity-60"
              >
                {game.emoji}
              </span>
              <span className="rounded-full border border-dashed border-white/25 px-2 py-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.15em]">
                Binnenkort
              </span>
            </div>
            <h2 className="mt-3 font-display text-lg font-black uppercase leading-tight tracking-wide">
              {game.name}
            </h2>
            <p className="mt-1 text-sm font-medium">{game.description}</p>
          </div>
        ),
      )}
    </div>
  );
}
