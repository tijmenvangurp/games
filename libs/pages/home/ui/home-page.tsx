import { gameCatalog } from "@entities/game";
import { GameMenu } from "@widgets/game-menu";
import { Gamepad2, Sparkles } from "@shared/ui";

const availableGames = gameCatalog.filter((game) => game.status === "available").length;

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 pb-12 pt-safe">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl border border-primary/45 bg-primary/10 text-primary shadow-[0_0_34px_-8px_var(--primary)]">
            <Gamepad2 aria-hidden="true" className="size-7" />
          </span>
          <div>
            <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary">
              Insert coin
            </p>
            <h1 className="font-display text-3xl font-black uppercase tracking-[0.08em]">
              Spellen
            </h1>
          </div>
        </div>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-primary shadow-[0_0_26px_-10px_var(--primary)]">
          {availableGames} spellen
        </span>
      </header>

      <section className="game-panel relative isolate overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-fuchsia-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 left-1/3 -z-10 size-56 rounded-full bg-cyan-400/20 blur-3xl"
        />

        <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary">
          Kies je cabinet
        </p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl font-black uppercase leading-[1.1] sm:text-4xl">
          <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
            Klaar voor de volgende highscore?
          </span>
        </h2>
        <p className="mt-3 max-w-xl text-sm font-semibold text-muted-foreground sm:text-base">
          Tien spellen, één donkere speelhal. Puzzel, reken, zoek en schaak op telefoon en tablet.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-cyan-200">
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1">
            🧩 Puzzelen
          </span>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1">
            🔍 Zoeken
          </span>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1">
            🔢 Rekenen
          </span>
          <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1">
            ♞ Schaken
          </span>
        </div>
      </section>

      <GameMenu />

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-center font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <Sparkles aria-hidden="true" className="size-4 text-primary" />
        Meer spellen laden…
      </p>
    </main>
  );
}
