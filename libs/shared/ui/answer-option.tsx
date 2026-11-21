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
      {showIndicator && state === "correct" ? (
        <Check aria-hidden="true" className="size-5 shrink-0" />
      ) : null}
      {showIndicator && (state === "wrong" || state === "warn") ? (
        wrongIcon === "retry" ? (
          <RotateCcw aria-hidden="true" className="size-5 shrink-0" />
        ) : (
          <X aria-hidden="true" className="size-5 shrink-0" />
        )
      ) : null}
    </button>
  );
}
