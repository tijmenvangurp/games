import { Button, Lightbulb, RotateCcw, SpeechButton, ZoomIn, ZoomOut } from "@shared/ui";
import type { WordSearchFeedback } from "../model/audio";
import { WordSearchWordList } from "./word-search-word-list";

interface WordSearchActionsProps {
  complete: boolean;
  nextWord: string | undefined;
  zoomed: boolean;
  feedback: WordSearchFeedback;
  onHint: (word: string) => void;
  onNew: () => void;
  onToggleZoom: () => void;
}

interface WordSearchSidebarProps extends WordSearchActionsProps {
  words: readonly string[];
  found: readonly string[];
}

function WordSearchActions({
  complete,
  nextWord,
  zoomed,
  feedback,
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
          <Lightbulb aria-hidden="true" className="size-4 text-warning" />
          Hint
        </Button>
        <Button variant="outline" onClick={onNew}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Nieuw bord
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

      <div className="flex items-center justify-center gap-1">
        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {feedback.text}
        </p>
        <SpeechButton className="shrink-0" label="Beluister de uitleg" line={feedback.lines} />
      </div>
    </div>
  );
}

export function WordSearchSidebar({
  words,
  found,
  complete,
  nextWord,
  zoomed,
  feedback,
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
        feedback={feedback}
        nextWord={nextWord}
        zoomed={zoomed}
        onHint={onHint}
        onNew={onNew}
        onToggleZoom={onToggleZoom}
      />
    </aside>
  );
}
