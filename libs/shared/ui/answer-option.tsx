import type { ComponentProps, ReactNode } from "react";
import { cn } from "@shared/lib";
import { answerOptionRecipe, type AnswerOptionVariants } from "./answer-option.css";
import { Check, RotateCcw, X } from "./icons";

export type AnswerState = NonNullable<AnswerOptionVariants["state"]>;

const BADGE_CLASSES: Record<AnswerState, string> = {
  default: "bg-muted text-muted-foreground",
  correct: "bg-success text-success-foreground",
  wrong: "bg-danger text-primary-foreground",
  warn: "bg-warning text-primary-foreground",
  muted: "bg-muted text-muted-foreground",
};

/** Alleen deze drie staten krijgen een vinkje of kruisje in beeld. */
const MARKED_STATES: ReadonlySet<AnswerState> = new Set(["correct", "wrong", "warn"]);

const OVERLAY_TONE: Partial<Record<AnswerState, string>> = {
  correct: "text-success-ink",
  wrong: "text-danger-ink",
  warn: "text-warning-ink",
};

interface AnswerIndicatorProps {
  state: AnswerState;
  wrongIcon: "x" | "retry";
  /** Op een antwoord met afbeelding of losse tekst: als chip in de hoek. */
  overlay: boolean;
}

/**
 * Het vinkje of kruisje van een antwoord. Zonder letterbadge ligt het als
 * chip in de hoek, zodat een afbeelding of lang woord de volle breedte houdt.
 */
function AnswerIndicator({ state, wrongIcon, overlay }: AnswerIndicatorProps) {
  if (!MARKED_STATES.has(state)) {
    return null;
  }

  const Icon = state === "correct" ? Check : wrongIcon === "retry" ? RotateCcw : X;
  const iconSize = overlay ? "size-4" : "size-5";

  if (!overlay) {
    return <Icon aria-hidden="true" className={cn(iconSize, "shrink-0")} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-card shadow-xs",
        OVERLAY_TONE[state],
      )}
    >
      <Icon className={iconSize} />
    </span>
  );
}

interface AnswerOptionProps extends Omit<ComponentProps<"button">, "children"> {
  state?: AnswerState;
  size?: AnswerOptionVariants["size"];
  /** Optioneel letterlabel links (A, B, C, D) voor meerkeuzelijsten. */
  badge?: string;
  showIndicator?: boolean;
  wrongIcon?: "x" | "retry";
  children: ReactNode;
}

export function AnswerOption({
  state = "default",
  size = "md",
  badge,
  showIndicator = true,
  wrongIcon = "x",
  className,
  disabled,
  children,
  ...props
}: AnswerOptionProps) {
  return (
    <button
      className={cn(
        answerOptionRecipe({ state, size }),
        badge && "w-full justify-start gap-3 px-3 text-left",
        className,
      )}
      data-answer-state={state}
      disabled={disabled ?? state !== "default"}
      type="button"
      {...props}
    >
      {badge ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
            BADGE_CLASSES[state],
          )}
        >
          {badge}
        </span>
      ) : null}
      {badge ? <span className="min-w-0 flex-1">{children}</span> : children}
      {showIndicator ? (
        <AnswerIndicator overlay={!badge} state={state} wrongIcon={wrongIcon} />
      ) : null}
    </button>
  );
}
