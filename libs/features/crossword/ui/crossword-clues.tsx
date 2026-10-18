import type { CrosswordEntry } from "@entities/crossword";
import { cn } from "@shared/lib";

interface ClueItem {
  entry: CrosswordEntry;
  index: number;
}

interface ClueListProps {
  title: string;
  items: readonly ClueItem[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

function ClueList({ title, items, selectedIndex, onSelect }: ClueListProps) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-1.5">
        {items.map(({ entry, index }) => (
          <li key={`${entry.number}-${entry.direction}`}>
            <button
              aria-pressed={selectedIndex === index}
              className={cn(
                "flex min-h-11 w-full items-start gap-2 rounded-xl border px-2.5 py-1.5 text-left text-sm transition-colors",
                selectedIndex === index
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/15"
                  : "border-border bg-card hover:bg-muted",
              )}
              type="button"
              onClick={() => onSelect(index)}
            >
              <span className="mt-0.5 shrink-0 font-black">{entry.number}</span>
              <span>{entry.clue}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface CrosswordCluesProps {
  entries: readonly CrosswordEntry[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function CrosswordClues({ entries, selectedIndex, onSelect }: CrosswordCluesProps) {
  const across = entries.flatMap((entry, index) =>
    entry.direction === "across" ? [{ entry, index }] : [],
  );
  const down = entries.flatMap((entry, index) =>
    entry.direction === "down" ? [{ entry, index }] : [],
  );

  return (
    <div className="grid gap-4">
      <ClueList
        items={across}
        selectedIndex={selectedIndex}
        title="Horizontaal"
        onSelect={onSelect}
      />
      <ClueList items={down} selectedIndex={selectedIndex} title="Verticaal" onSelect={onSelect} />
    </div>
  );
}
