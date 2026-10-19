import { Link } from "@tanstack/react-router";
import { gameCatalog } from "@entities/game";
import { GameIcon } from "@shared/ui";

export function GameMenu() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {gameCatalog.map((game) =>
        game.status === "available" ? (
          <Link
            key={game.id}
            className="game-card group flex flex-col overflow-hidden p-0 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 active:translate-y-0"
            to={game.to}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <img
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                decoding="async"
                height={500}
                loading="lazy"
                src={game.thumbnail}
                width={800}
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-display text-2xl leading-snug">{game.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {game.description}
              </p>
            </div>
          </Link>
        ) : (
          <div
            key={game.id}
            aria-disabled="true"
            className="game-card flex min-h-40 flex-col border-dashed bg-card/70 p-5 text-muted-foreground"
          >
            <span className="grid size-11 place-items-center rounded-lg bg-muted">
              <GameIcon aria-hidden="true" name={game.id} size={24} />
            </span>
            <h2 className="mt-4 font-display text-2xl leading-snug">{game.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed">{game.description}</p>
            <span className="mt-auto pt-4 font-display text-sm italic">Binnenkort</span>
          </div>
        ),
      )}
    </div>
  );
}
