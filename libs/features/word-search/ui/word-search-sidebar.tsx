import { Button, Lightbulb, Panel, RotateCcw, SpeechButton, ZoomIn, ZoomOut } from "@shared/ui";
import { useTexts } from "@shared/i18n";
import type { WordSearchFeedback } from "../model/audio";
import { wordSearchTexts } from "./texts";
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
  const t = useTexts(wordSearchTexts);
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
          {t.hint}
        </Button>
        <Button variant="outline" onClick={onNew}>
          <RotateCcw aria-hidden="true" className="size-4" />
          {t.newBoard}
        </Button>
      </div>

      <Button className="w-full sm:hidden" variant="outline" onClick={onToggleZoom}>
        {zoomed ? (
          <ZoomOut aria-hidden="true" className="size-4" />
        ) : (
          <ZoomIn aria-hidden="true" className="size-4" />
        )}
        {zoomed ? t.wholeBoard : t.zoomIn}
      </Button>

      <div className="flex items-center justify-center gap-1">
        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {feedback.text}
        </p>
        <SpeechButton className="shrink-0" label={t.listenInstructions} line={feedback.lines} />
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
  const t = useTexts(wordSearchTexts);
  return (
    <aside className="space-y-3 lg:order-2 lg:col-span-1">
      <Panel padding="sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t.toFind}
        </p>
        <WordSearchWordList found={found} words={words} onHint={onHint} />
      </Panel>

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
