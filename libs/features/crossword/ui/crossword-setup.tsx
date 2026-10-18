import { POKEMON_CROSSWORD } from "@entities/crossword";
import { SetupActions } from "@shared/ui";

interface CrosswordSetupProps {
  hasActiveGame: boolean;
  onStart: () => void;
  onBack: () => void;
}

export function CrosswordSetup({ hasActiveGame, onStart, onBack }: CrosswordSetupProps) {
  return (
    <section className="animate-rise rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">Kies een categorie.</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-3 text-primary ring-2 ring-primary/15">
        <span aria-hidden="true" className="text-3xl">
          ⚡
        </span>
        <div>
          <p className="text-base font-black">{POKEMON_CROSSWORD.category}</p>
          <p className="text-xs font-semibold text-muted-foreground">
            {POKEMON_CROSSWORD.entries.length} woorden · Nederlandse hints
          </p>
        </div>
      </div>

      <SetupActions
        backLabel="Terug naar je kruiswoord"
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
        startLabel="Spelen"
      />
    </section>
  );
}
