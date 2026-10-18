import { Check, X } from "@shared/ui";
import { cn } from "@shared/lib";
import { frenchAnswerState } from "../lib/answer-state";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

const OPTION_CLASSES = {
  idle: "border-border bg-card hover:bg-muted",
  correct: "border-emerald-400 bg-emerald-50 text-emerald-900",
  wrong: "border-rose-400 bg-rose-50 text-rose-900",
  muted: "border-border bg-muted/40 text-muted-foreground opacity-70",
} as const;

const BADGE_CLASSES = {
  idle: "bg-muted text-muted-foreground",
  correct: "bg-emerald-500 text-white",
  wrong: "bg-rose-500 text-white",
  muted: "bg-muted text-muted-foreground",
} as const;

interface FrenchOptionProps {
  option: string;
  index: number;
  correct: string;
  selected: string | null;
  answered: boolean;
  onSelect: (option: string) => void;
}

export function FrenchOption({
  option,
  index,
  correct,
  selected,
  answered,
  onSelect,
}: FrenchOptionProps) {
  const state = frenchAnswerState(answered, option === correct, option === selected);

  return (
    <button
      aria-label={option}
      aria-pressed={option === selected}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left text-base font-bold leading-snug transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:active:scale-100",
        OPTION_CLASSES[state],
      )}
      data-answer-state={state}
      disabled={answered}
      type="button"
      onClick={() => onSelect(option)}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-sm",
          BADGE_CLASSES[state],
        )}
      >
        {OPTION_LETTERS[index]}
      </span>
      <span className="min-w-0 flex-1">{option}</span>
      {state === "correct" ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
      {state === "wrong" ? <X aria-hidden="true" className="size-5 shrink-0" /> : null}
    </button>
  );
}
