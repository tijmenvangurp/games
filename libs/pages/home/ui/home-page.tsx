import { GameMenu } from "@widgets/game-menu";
import { Gamepad2, Sparkles } from "@shared/ui";

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-safe">
      <header className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Gamepad2 aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Spelen
          </p>
          <h1 className="text-2xl font-black tracking-tight">Spellen</h1>
        </div>
      </header>

      <p className="text-muted-foreground">
        Kies een spelletje. Alles werkt op telefoon en tablet.
      </p>

      <GameMenu />

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-center text-xs text-muted-foreground">
        <Sparkles aria-hidden="true" className="size-3.5" />
        Meer spelletjes komen eraan.
      </p>
    </main>
  );
}
