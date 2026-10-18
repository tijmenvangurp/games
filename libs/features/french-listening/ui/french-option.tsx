import { Check, X } from "@shared/ui";
import { cn } from "@shared/lib";
import { frenchAnswerState } from "../lib/answer-state";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

const OPTION_CLASSES = {
  idle: "border-border bg-card hover:bg-muted/60",
  correct: "border-success/45 bg-success/10 text-success",
  wrong: "border-danger/45 bg-danger/10 text-danger",
  muted: "border-border bg-muted/40 text-muted-foreground opacity-70",
} as const;

const BADGE_CLASSES = {
  idle: "bg-muted text-muted-foreground",
  correct: "bg-success text-white",
  wrong: "bg-danger text-white",
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
        "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-base font-bold leading-snug transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:active:scale-100",
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
