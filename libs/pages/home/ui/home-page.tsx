import { gameCatalog } from "@entities/game";
import { GameMenu } from "@widgets/game-menu";
import { Sparkles } from "@shared/ui";

const availableGames = gameCatalog.filter((game) => game.status === "available").length;

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-8 px-5 pb-12 pt-safe sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-display text-sm italic text-muted-foreground">
            voor kleine ontdekkers
          </p>
          <h1 className="font-display text-4xl font-normal tracking-tight sm:text-5xl">Spellen</h1>
        </div>
        <p className="font-display text-sm italic text-muted-foreground">
          {availableGames} kleine avonturen
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-[1.4fr_0.6fr] sm:items-end">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-primary">
            Het spelletjesboek
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl leading-[1.08] sm:text-5xl">
            Kies een pagina.
            <br />
            <em className="text-primary">Begin een avontuur.</em>
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Puzzelen, rekenen, zoeken of een potje schaken. Alles werkt rustig op telefoon en
            tablet, zonder haast.
          </p>
        </div>

        <aside className="border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0">
          <span aria-hidden="true" className="font-display text-4xl leading-none text-primary">
            ✳
          </span>
          <p className="mt-2 max-w-xs font-display text-base italic leading-relaxed text-muted-foreground">
            Tien verhalen om te ontdekken. Kies er eentje en sla de pagina open.
          </p>
        </aside>
      </section>

      <GameMenu />

      <p className="mt-auto flex items-center justify-center gap-2 pt-6 text-center font-display text-sm italic text-muted-foreground">
        <Sparkles aria-hidden="true" className="size-4 text-primary" />
        Meer pagina&apos;s volgen.
      </p>
    </main>
  );
}
