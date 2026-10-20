import { Button, Volume2 } from "@shared/ui";

interface FrenchAudioPanelProps {
  kind: "word" | "phrase";
  onReplay: (rate: number) => void;
}

export function FrenchAudioPanel({ kind, onReplay }: FrenchAudioPanelProps) {
  const isWord = kind === "word";
  const label = isWord ? "Luister naar het woord" : "Luister naar de zin";
  const ariaLabel = isWord ? "Beluister het Franse woord" : "Beluister de Franse zin";

  return (
    <div className="game-panel p-5 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <button
        aria-label={ariaLabel}
        className="mx-auto mt-3 grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
        type="button"
        onClick={() => onReplay(1)}
      >
        <Volume2 aria-hidden="true" className="size-10" />
      </button>
      <div className="mt-3 flex justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onReplay(0.7)}>
          Langzaam
        </Button>
      </div>
    </div>
  );
}
