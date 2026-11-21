import { Link } from "@tanstack/react-router";
import { gameCatalog } from "@entities/game";
import { Badge, GameIcon } from "@shared/ui";
import { menuCard, menuCardDisabled, menuCardMedia, menuCardThumb } from "./game-menu.css";

export function GameMenu() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gameCatalog.map((game) =>
        game.status === "available" ? (
          <Link key={game.id} className={menuCard} to={game.to}>
            <div className={menuCardMedia}>
              <img
                alt=""
                className={menuCardThumb}
                decoding="async"
                height={500}
                loading="lazy"
                src={game.thumbnail}
                width={800}
              />
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-primary"
                >
                  <GameIcon name={game.id} size={18} />
                </span>
                <h2 className="font-display text-xl leading-snug tracking-tight sm:text-2xl">
                  {game.name}
                </h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {game.description}
              </p>
            </div>
          </Link>
        ) : (
          <div key={game.id} aria-disabled="true" className={menuCardDisabled}>
            <span className="grid size-11 place-items-center rounded-lg bg-muted">
              <GameIcon aria-hidden="true" name={game.id} size={24} />
            </span>
            <h2 className="mt-4 font-display text-xl leading-snug">{game.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed">{game.description}</p>
            <div className="mt-auto pt-4">
              <Badge tone="neutral">Binnenkort</Badge>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
