import { Link } from "@tanstack/react-router";
import { gameCatalog, type GameCategory } from "@entities/game";
import { Badge, GameIcon } from "@shared/ui";
import {
  menuCard,
  menuCardDisabled,
  menuCardIcon,
  menuCardMat,
  menuCardMedia,
  menuCardThumb,
} from "./game-menu.css";

interface GameMenuProps {
  category?: GameCategory | "all";
}

export function GameMenu({ category = "all" }: GameMenuProps) {
  const entries =
    category === "all" ? gameCatalog : gameCatalog.filter((game) => game.category === category);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((game) =>
        game.status === "available" ? (
          <Link key={game.id} className={menuCard} to={game.to}>
            <div className={menuCardMat}>
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
            </div>
            <div className="flex flex-1 flex-col px-4 pb-5 pt-3.5 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className={menuCardIcon}>
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
