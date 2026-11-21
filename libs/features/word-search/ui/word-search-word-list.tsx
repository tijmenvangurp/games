import { cn } from "@shared/lib";
import { Check, SpeechButton } from "@shared/ui";
import { useTexts } from "@shared/i18n";
import { wordSpeech } from "../model/audio";
import { wordSearchTexts } from "./texts";

interface WordSearchWordListProps {
  words: readonly string[];
  found: readonly string[];
  onHint: (word: string) => void;
}

export function WordSearchWordList({ words, found, onHint }: WordSearchWordListProps) {
  const t = useTexts(wordSearchTexts);
  return (
    <div
      aria-label={t.wordsToFind}
      className="grid grid-cols-2 gap-1.5 lg:grid-cols-1"
      role="group"
    >
      {words.map((word) => {
        const isFound = found.includes(word);
        const speech = wordSpeech(word);

        return (
          <div
            key={word}
            className={cn(
              "flex min-h-11 min-w-0 items-center justify-between rounded-xl border transition-colors",
              isFound
                ? "border-success/40 bg-success-soft text-success-ink"
                : "border-border bg-card text-foreground",
            )}
          >
            <button
              aria-label={word}
              aria-pressed={isFound}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-1.5 rounded-xl px-3 py-1.5 text-left text-sm font-bold transition hover:bg-background-subtle active:scale-[0.99]"
              type="button"
              onClick={() => onHint(word)}
            >
              <span className={cn("truncate", isFound && "line-through")}>{word}</span>
              {isFound ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
            </button>
            {speech ? (
              <SpeechButton className="mr-1 shrink-0" label={t.listenWord(word)} line={speech} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
