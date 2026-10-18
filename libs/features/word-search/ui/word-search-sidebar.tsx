import { Button, Lightbulb, RotateCcw, ZoomIn, ZoomOut } from "@shared/ui";
import { WordSearchWordList } from "./word-search-word-list";

interface WordSearchActionsProps {
  complete: boolean;
  nextWord: string | undefined;
  selectedCount: number;
  wrong: boolean;
  zoomed: boolean;
  lastFound: string | null;
  onHint: (word: string) => void;
  onNew: () => void;
  onToggleZoom: () => void;
}

interface WordSearchSidebarProps extends WordSearchActionsProps {
  words: readonly string[];
  found: readonly string[];
}

function statusText(complete: boolean, wrong: boolean, selectedCount: number): string {
  if (complete) {
    return "Alle woorden gevonden!";
  }
  if (wrong) {
    return "Die niet — probeer een andere lijn.";
  }
  if (selectedCount === 1) {
    return "Kies de laatste letter.";
  }
  return "Sleep over een woord of tik de eerste en de laatste letter.";
}

function WordSearchActions({
  complete,
  nextWord,
  selectedCount,
  wrong,
  zoomed,
  lastFound,
  onHint,
  onNew,
  onToggleZoom,
}: WordSearchActionsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={complete || !nextWord}
          variant="outline"
          onClick={() => {
            if (nextWord) {
              onHint(nextWord);
            }
          }}
        >
          <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
          Hint
        </Button>
        <Button variant="outline" onClick={onNew}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Nieuw
        </Button>
      </div>

      <Button className="w-full sm:hidden" variant="outline" onClick={onToggleZoom}>
        {zoomed ? (
          <ZoomOut aria-hidden="true" className="size-4" />
        ) : (
          <ZoomIn aria-hidden="true" className="size-4" />
        )}
        {zoomed ? "Heel bord" : "Vergroot"}
      </Button>

      <p aria-live="polite" className="text-center text-xs text-muted-foreground">
        {statusText(complete, wrong, selectedCount)}
      </p>
      <p aria-live="polite" className="sr-only">
        {lastFound ? `${lastFound} gevonden` : ""}
      </p>
    </div>
  );
}

export function WordSearchSidebar({
  words,
  found,
  complete,
  nextWord,
  selectedCount,
  wrong,
  zoomed,
  lastFound,
  onHint,
  onNew,
  onToggleZoom,
}: WordSearchSidebarProps) {
  return (
    <aside className="space-y-3 lg:order-2 lg:col-span-1">
      <div className="game-panel p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Te zoeken
        </p>
        <WordSearchWordList found={found} words={words} onHint={onHint} />
      </div>

      <WordSearchActions
        complete={complete}
        lastFound={lastFound}
        nextWord={nextWord}
        selectedCount={selectedCount}
        wrong={wrong}
        zoomed={zoomed}
        onHint={onHint}
        onNew={onNew}
        onToggleZoom={onToggleZoom}
      />
    </aside>
  );
}
