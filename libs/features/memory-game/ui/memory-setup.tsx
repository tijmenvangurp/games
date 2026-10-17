import type { MemoryDifficulty } from "@entities/memory";
import { OptionPicker, SetupActions } from "@shared/ui";
import { MEMORY_DIFFICULTY_OPTIONS, type MemorySettings } from "../model/settings";

interface MemorySetupProps {
  settings: MemorySettings;
  hasActiveGame: boolean;
  onDifficultyChange: (difficulty: MemoryDifficulty) => void;
  onStart: () => void;
  onBack: () => void;
}

export function MemorySetup({
  settings,
  hasActiveGame,
  onDifficultyChange,
  onStart,
  onBack,
}: MemorySetupProps) {
  return (
    <section className="animate-rise rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">
          Hoeveel Pokémon-paren wil je zoeken? Alle kaarten komen uit Generatie 1.
        </p>
      </div>

      <OptionPicker
        legend="Moeilijkheid"
        options={MEMORY_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />

      <SetupActions
        backLabel="Terug naar je spel"
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
      />

      <details className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        <summary className="cursor-pointer font-semibold">Bronnen en credits</summary>
        <p className="mt-2">
          Pokémon © Nintendo, Creatures en GAME FREAK. Fanproject zonder officiële band. Assets:{" "}
          <a
            className="font-semibold underline"
            href="https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/official-artwork"
            rel="noreferrer"
            target="_blank"
          >
            PokeAPI artwork
          </a>
          ,{" "}
          <a
            className="font-semibold underline"
            href="https://play.pokemonshowdown.com/audio/cries/"
            rel="noreferrer"
            target="_blank"
          >
            Showdown-audio
          </a>{" "}
          en{" "}
          <a
            className="font-semibold underline"
            href="https://play.pokemonshowdown.com/sprites/ani/"
            rel="noreferrer"
            target="_blank"
          >
            Showdown-sprites
          </a>
          .
        </p>
      </details>
    </section>
  );
}
