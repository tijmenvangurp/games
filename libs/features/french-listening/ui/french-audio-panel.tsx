import { Button, Panel, Volume2 } from "@shared/ui";

interface FrenchAudioPanelProps {
  kind: "word" | "phrase";
  onReplay: (rate: number) => void;
}

export function FrenchAudioPanel({ kind, onReplay }: FrenchAudioPanelProps) {
  const isWord = kind === "word";
  const label = isWord ? "Luister naar het woord" : "Luister naar de zin";
  const ariaLabel = isWord ? "Beluister het Franse woord" : "Beluister de Franse zin";

  return (
    <Panel className="text-center" padding="lg">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <Button
        aria-label={ariaLabel}
        className="mx-auto mt-3 size-24 rounded-full p-0"
        onClick={() => onReplay(1)}
      >
        <Volume2 aria-hidden="true" className="size-10" />
      </Button>
      <div className="mt-3 flex justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onReplay(0.7)}>
          Langzaam
        </Button>
      </div>
    </Panel>
  );
}
