import { Link } from "@tanstack/react-router";
import { gameCatalog } from "@entities/game";
import { GameIcon } from "@shared/ui";

export function GameMenu() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {gameCatalog.map((game, index) =>
        game.status === "available" ? (
          <Link
            key={game.id}
            className="game-card group flex min-h-40 flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 active:translate-y-0"
            to={game.to}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-display text-xs tracking-[0.2em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="grid size-11 place-items-center rounded-lg bg-muted text-primary">
                <GameIcon aria-hidden="true" name={game.id} size={24} />
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl leading-snug">{game.name}</h2>
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
              <span className="grid size-11 place-items-center rounded-lg bg-muted">
                <GameIcon aria-hidden="true" name={game.id} size={24} />
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl leading-snug">{game.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed">{game.description}</p>
            <span className="mt-auto pt-4 font-display text-sm italic">Binnenkort</span>
          </div>
        ),
      )}
    </div>
  );
}
