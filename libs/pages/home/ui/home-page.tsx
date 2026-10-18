import { gameCatalog } from "@entities/game";
import { GameMenu } from "@widgets/game-menu";
import { Gamepad2, Sparkles } from "@shared/ui";

const availableGames = gameCatalog.filter((game) => game.status === "available").length;

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 pb-12 pt-safe">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-14 -rotate-3 place-items-center rounded-2xl border-[3px] border-foreground bg-primary text-primary-foreground shadow-[0_4px_0_var(--border)]">
            <Gamepad2 aria-hidden="true" className="size-7" />
          </span>
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
              De speeltuin
            </p>
            <h1 className="font-display text-3xl font-black tracking-tight">Spellen</h1>
          </div>
        </div>
        <span className="rotate-2 rounded-full border-2 border-foreground bg-card px-3 py-1.5 text-xs font-black shadow-[0_3px_0_var(--border)]">
          {availableGames}x spelen
        </span>
      </header>

      <section className="game-panel relative isolate overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-12 -z-10 size-40 rounded-full bg-[#ffd9a8]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-14 right-16 -z-10 size-32 rotate-12 rounded-3xl bg-[#bfe8e2]"
        />
        <div
          aria-hidden="true"
          className="absolute right-6 top-6 -z-10 text-3xl opacity-70 sm:text-4xl"
        >
          ✨
        </div>

        <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Kies je avontuur
        </p>
        <h2 className="mt-1 max-w-xl font-display text-3xl font-black leading-[1.05] sm:text-4xl">
          Hoi! Wat gaan we vandaag spelen?
        </h2>
        <p className="mt-3 max-w-xl text-sm font-semibold text-muted-foreground sm:text-base">
          Puzzelen, rekenen, zoeken of een potje schaken. Alles werkt op telefoon en tablet.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border-2 border-foreground bg-[#ffe3a3] px-3 py-1 text-xs font-black">
            🧩 Puzzelen
          </span>
          <span className="rounded-full border-2 border-foreground bg-[#c9f2c7] px-3 py-1 text-xs font-black">
            🔍 Zoeken
          </span>
          <span className="rounded-full border-2 border-foreground bg-[#cfe1ff] px-3 py-1 text-xs font-black">
            🔢 Rekenen
          </span>
          <span className="rounded-full border-2 border-foreground bg-[#ffd0c7] px-3 py-1 text-xs font-black">
            ♞ Schaken
          </span>
        </div>
      </section>

      <GameMenu />

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-center text-xs font-bold text-muted-foreground">
        <Sparkles aria-hidden="true" className="size-4 text-amber-500" />
        Meer spelletjes komen eraan.
      </p>
    </main>
  );
}
