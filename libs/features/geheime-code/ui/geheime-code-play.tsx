import type { Puzzle } from "@entities/geheime-code";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Button, Confetti, Panel } from "@shared/ui";
import { useGeheimeCodeKeyboard } from "../model/use-geheime-code-keyboard";
import { useGeheimeCodeStore } from "../model/use-geheime-code-store";
import { AlphabetKeyboard } from "./alphabet-keyboard";
import { CodeTable } from "./code-table";
import { CodeWord } from "./code-word";
import { geheimeCodePlayTexts } from "./texts";

type PlayTexts = (typeof geheimeCodePlayTexts)["nl"];

interface RoundViewProps {
  puzzle: Puzzle;
  entries: readonly (readonly string[])[];
  activeRow: number;
  activeCell: number;
  hintLetter: string | null;
  wrongCell: number | null;
  wordDone: boolean;
}

function announcementFor(t: PlayTexts, wordDone: boolean, wrongCell: number | null): string {
  if (wordDone) {
    return t.wordDone;
  }
  if (wrongCell !== null) {
    return t.tryAgain;
  }
  return "";
}

function RoundProgress({ total, active }: { total: number; active: number }) {
  return (
    <div aria-hidden="true" className="flex justify-center gap-2">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-2 rounded-full",
            index < active
              ? "bg-success"
              : index === active
                ? "bg-primary ring-4 ring-primary/15"
                : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

function RoundView({
  puzzle,
  entries,
  activeRow,
  activeCell,
  hintLetter,
  wrongCell,
  wordDone,
}: RoundViewProps) {
  const t = useTexts(geheimeCodePlayTexts);
  const row = puzzle.rows[activeRow];
  if (!row) {
    return null;
  }
  const last = activeRow === puzzle.rows.length - 1;

  return (
    <section
      aria-label={t.secretCode}
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:gap-4"
    >
      <CodeTable hintLetter={hintLetter} puzzle={puzzle} />

      <Panel as="section" className="code-card" padding="md">
        <CodeWord
          activeCell={activeCell}
          entries={entries[activeRow] ?? []}
          row={row}
          wordDone={wordDone}
          wrongCell={wrongCell}
          onSelect={(cell) => useGeheimeCodeStore.getState().selectCell(cell)}
        />

        {wordDone ? (
          <>
            <Confetti key={`word-${activeRow}`} pieces={18} variant="burst" />
            <div className="mt-4 flex justify-center">
              <Button size="lg" onClick={() => useGeheimeCodeStore.getState().nextWord()}>
                {last ? t.done : t.next}
              </Button>
            </div>
          </>
        ) : null}

        <p aria-live="polite" className="sr-only">
          {announcementFor(t, wordDone, wrongCell)}
        </p>
      </Panel>

      <AlphabetKeyboard
        onClear={() => useGeheimeCodeStore.getState().clearCell()}
        onLetter={(letter) => useGeheimeCodeStore.getState().typeLetter(letter)}
      />

      <RoundProgress active={activeRow} total={puzzle.rows.length} />
    </section>
  );
}

export function GeheimeCodePlay() {
  const state = useGeheimeCodeStore();
  useGeheimeCodeKeyboard();

  if (!state.puzzle) {
    return null;
  }

  return (
    <RoundView
      activeCell={state.activeCell}
      activeRow={state.activeRow}
      entries={state.entries}
      hintLetter={state.hintLetter}
      puzzle={state.puzzle}
      wordDone={state.wordDone}
      wrongCell={state.wrongCell}
    />
  );
}
