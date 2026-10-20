import { frenchAudioSrc, type FrenchItem } from "@entities/french";
import { Button, Check, RotateCcw, Sparkles, Volume2 } from "@shared/ui";
import type { SentenceToken } from "../model/sentence";
import { useFrenchAudio } from "./use-french-audio";

interface FinishedProps {
  score: number;
  total: number;
  onRestart: () => void;
}

export function SentenceBuilderFinished({ score, total, onRestart }: FinishedProps) {
  return (
    <div className="game-panel mx-auto flex w-full max-w-xl flex-col items-center gap-4 p-6 text-center">
      <Sparkles aria-hidden="true" className="size-10 text-primary" />
      <h2 className="font-display text-2xl">Klaar!</h2>
      <p className="text-muted-foreground">
        Je had {score} van {total} zinnen goed.
      </p>
      <Button size="lg" onClick={onRestart}>
        <RotateCcw aria-hidden="true" className="size-5" />
        Opnieuw
      </Button>
    </div>
  );
}

interface HeaderProps {
  index: number;
  total: number;
  score: number;
}

export function SentenceBuilderHeader({ index, total, score }: HeaderProps) {
  return (
    <div className="game-panel flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Bouw de zin
        </p>
        <p className="text-sm font-bold">
          Zin {index + 1} van {total}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black leading-none">{score}</p>
        <p className="text-xs text-muted-foreground">goed</p>
      </div>
    </div>
  );
}

export function SentencePrompt({ item }: { item: FrenchItem }) {
  const { play } = useFrenchAudio();

  return (
    <div className="game-panel p-4 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Maak deze zin in het Frans
      </p>
      <p className="mt-1 text-lg font-black">{item.nl}</p>
      <Button
        aria-label="Beluister de Franse zin"
        className="mt-2"
        size="sm"
        variant="outline"
        onClick={() => play(frenchAudioSrc(item))}
      >
        <Volume2 aria-hidden="true" className="size-5" />
        Beluister
      </Button>
    </div>
  );
}

interface AnswerProps {
  selected: readonly SentenceToken[];
  answered: boolean;
  onRemove: (token: SentenceToken) => void;
}

export function SentenceAnswer({ selected, answered, onRemove }: AnswerProps) {
  return (
    <div
      aria-label="Jouw zin"
      className="flex min-h-20 flex-wrap content-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-3"
      role="group"
    >
      {selected.length === 0 ? (
        <span className="text-sm text-muted-foreground">Tik de woorden in de juiste volgorde.</span>
      ) : (
        selected.map((token) => (
          <button
            key={token.id}
            aria-label={`Verwijder ${token.text}`}
            className="min-h-11 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-bold text-primary transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            disabled={answered}
            type="button"
            onClick={() => onRemove(token)}
          >
            {token.text}
          </button>
        ))
      )}
    </div>
  );
}

interface WordBankProps {
  available: readonly SentenceToken[];
  answered: boolean;
  onChoose: (token: SentenceToken) => void;
}

export function SentenceWordBank({ available, answered, onChoose }: WordBankProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {available.map((token) => (
        <button
          key={token.id}
          aria-label={`Kies ${token.text}`}
          className="min-h-11 rounded-lg border border-border bg-card px-3 py-2 font-bold transition hover:bg-muted active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-40"
          disabled={answered}
          type="button"
          onClick={() => onChoose(token)}
        >
          {token.text}
        </button>
      ))}
    </div>
  );
}

interface FeedbackProps {
  item: FrenchItem;
  correct: boolean;
  onNext: () => void;
}

export function SentenceFeedback({ item, correct, onNext }: FeedbackProps) {
  return (
    <div aria-live="polite" className="game-panel space-y-2 p-4">
      <p className={correct ? "font-black text-success" : "font-black text-warning"}>
        {correct ? "Je vond het!" : "Nog niet."}
      </p>
      <p className="text-sm text-muted-foreground">
        De zin is: <strong>{item.fr}</strong>
      </p>
      <Button className="w-full" size="lg" onClick={onNext}>
        Volgende
      </Button>
    </div>
  );
}

interface ControlsProps {
  disabled: boolean;
  onCheck: () => void;
  onReset: () => void;
}

export function SentenceControls({ disabled, onCheck, onReset }: ControlsProps) {
  return (
    <div className="flex gap-2">
      <Button className="flex-1" disabled={disabled} size="lg" onClick={onCheck}>
        <Check aria-hidden="true" className="size-5" />
        Controleer
      </Button>
      <Button size="lg" variant="outline" onClick={onReset}>
        <RotateCcw aria-hidden="true" className="size-5" />
        Opnieuw
      </Button>
    </div>
  );
}
