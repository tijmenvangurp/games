import { knownLetters, LETTERS, type LetterProgressMap } from "@entities/letter";
import { Button, Play } from "@shared/ui";

interface LetterSetupProps {
  progress: LetterProgressMap;
  onStart: () => void;
}

export function LetterSetup({ progress, onStart }: LetterSetupProps) {
  const known = knownLetters(progress);

  return (
    <section className="game-panel mx-auto w-full max-w-xl p-4 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        10 letters · 6 vragen
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight">Hoor de klank. Kies de letter.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Je hoort een klank. Welke letter hoort erbij? Soms hoor je een woord en zoek je de
        beginletter, soms zoek of bouw je een woord.
      </p>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {LETTERS.map((letter) => (
          <span
            key={letter.id}
            className="flex min-h-12 items-center justify-center rounded-xl border bg-muted/50 text-2xl font-black"
          >
            {letter.glyph}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        {known.length > 0
          ? `Deze letters ken je al: ${known.join(", ")}.`
          : "We beginnen met i, k, m, s, p, v, e, n, t en a."}
      </p>

      <Button className="mt-4 w-full" size="lg" onClick={onStart}>
        <Play aria-hidden="true" className="size-5" />
        Start de letterronde
      </Button>

      <div className="mt-4 rounded-2xl bg-muted p-3 text-sm">
        <p className="font-bold">Tip voor ouders</p>
        <p className="mt-1 text-muted-foreground">
          Laat je kind de letter na de ronde ook op papier schrijven. Dat helpt bij het onthouden
          van de vorm.
        </p>
      </div>
    </section>
  );
}
