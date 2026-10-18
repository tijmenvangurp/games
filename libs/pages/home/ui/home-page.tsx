import { GameMenu } from "@widgets/game-menu";

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-5 pb-12 pt-safe sm:px-8">
      <header className="border-b border-border pb-4">
        <h1 className="font-display text-4xl font-normal tracking-tight">Spellen</h1>
      </header>

      <GameMenu />
    </main>
  );
}
