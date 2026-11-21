import type { ComponentProps, ReactNode } from "react";
import { cn } from "@shared/lib";
import { answerOptionRecipe, type AnswerOptionVariants } from "./answer-option.css";
import { Check, X } from "./icons";

export type AnswerState = NonNullable<AnswerOptionVariants["state"]>;

interface AnswerOptionProps extends Omit<ComponentProps<"button">, "children"> {
  state?: AnswerState;
  size?: AnswerOptionVariants["size"];
  showIndicator?: boolean;
  children: ReactNode;
}

export function AnswerOption({
  state = "default",
  size = "md",
  showIndicator = true,
  className,
  disabled,
  children,
  ...props
}: AnswerOptionProps) {
  return (
    <button
      className={cn(answerOptionRecipe({ state, size }), className)}
      data-answer-state={state}
      disabled={disabled ?? state !== "default"}
      type="button"
      {...props}
    >
      {children}
      {showIndicator && state === "correct" ? (
        <Check aria-hidden="true" className="size-5 shrink-0" />
      ) : null}
      {showIndicator && (state === "wrong" || state === "warn") ? (
        <X aria-hidden="true" className="size-5 shrink-0" />
      ) : null}
    </button>
  );
}
