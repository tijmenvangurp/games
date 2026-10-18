import { gameCatalog } from "@entities/game";
import { GameMenu } from "@widgets/game-menu";
import { GameIcon } from "@shared/ui";

const availableGames = gameCatalog.filter((game) => game.status === "available").length;

const CATEGORIES = [
  { icon: "sudoku", label: "Puzzelen" },
  { icon: "math-trainer", label: "Rekenen" },
  { icon: "seek", label: "Zoeken" },
  { icon: "chess-tutorial", label: "Schaken" },
] as const;

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-8 px-5 pb-12 pt-safe sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-display text-sm italic text-muted-foreground">Spelen</p>
          <h1 className="font-display text-4xl font-normal tracking-tight sm:text-5xl">Spellen</h1>
        </div>
        <p className="font-display text-sm italic text-muted-foreground">
          {availableGames} spellen
        </p>
      </header>

      <section>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-primary">
          Kies je spel
        </p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl leading-[1.08] sm:text-5xl">
          Rustig beginnen.
          <br />
          <em className="text-primary">Zelf je tempo.</em>
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Puzzelen, rekenen, zoeken of schaken. Alles werkt op telefoon en tablet, zonder haast.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <li
              key={category.label}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold"
            >
              <GameIcon aria-hidden="true" name={category.icon} size={18} />
              {category.label}
            </li>
          ))}
        </ul>
      </section>

      <GameMenu />

      <p className="mt-auto pt-6 text-center font-display text-sm italic text-muted-foreground">
        Meer spellen volgen.
      </p>
    </main>
  );
}
