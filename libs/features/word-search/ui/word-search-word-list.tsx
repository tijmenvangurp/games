import { cn } from "@shared/lib";
import { Check } from "@shared/ui";

interface WordSearchWordListProps {
  words: readonly string[];
  found: readonly string[];
  onHint: (word: string) => void;
}

export function WordSearchWordList({ words, found, onHint }: WordSearchWordListProps) {
  return (
    <div aria-label="Te zoeken woorden" className="flex flex-wrap gap-2" role="group">
      {words.map((word) => {
        const isFound = found.includes(word);

        return (
          <button
            key={word}
            aria-pressed={isFound}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold transition active:scale-[0.99]",
              isFound
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-card text-foreground hover:bg-muted/60",
            )}
            type="button"
            onClick={() => onHint(word)}
          >
            <span className={isFound ? "line-through" : undefined}>{word}</span>
            {isFound ? <Check aria-hidden="true" className="size-4" /> : null}
          </button>
        );
      })}
    </div>
  );
}
