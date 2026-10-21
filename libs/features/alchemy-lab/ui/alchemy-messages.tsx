import { useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { elementName, type ElementId, type Hint } from "@entities/alchemy";
import { useAlchemyStore } from "../model/use-alchemy-store";
import type { AlchemyFeedback } from "../model/use-alchemy-store";

function hintText(hint: Hint, discovered: readonly ElementId[]): string {
  const firstKnown = discovered.includes(hint.a);
  const secondKnown = discovered.includes(hint.b);

  if (firstKnown && secondKnown) {
    return `Probeer ${elementName(hint.a)} + ${elementName(hint.b)}.`;
  }
  if (firstKnown) {
    return `Probeer ${elementName(hint.a)} met iets anders.`;
  }
  return `Probeer ${elementName(hint.b)} met iets anders.`;
}

function feedbackText(
  kind: "known" | "wrong" | "full" | "all-found",
  elementId?: ElementId,
): string {
  if (kind === "known") {
    return `Die had je al: ${elementId ? elementName(elementId) : "dit element"}.`;
  }
  if (kind === "wrong") {
    return "Hm, dat mengt niet. Probeer iets anders.";
  }
  if (kind === "full") {
    return "De werkbank is vol. Het oudste element ligt terug op het schap.";
  }
  return "Je hebt alle elementen ontdekt. Knap gedaan!";
}

interface AlchemyMessagesProps {
  discovered: readonly ElementId[];
  feedback: AlchemyFeedback | null;
  hint: Hint | null;
}

export function AlchemyMessages({ discovered, feedback, hint }: AlchemyMessagesProps) {
  useEffect(() => {
    if (!feedback || feedback.kind === "new") {
      return;
    }
    const timer = window.setTimeout(() => {
      useAlchemyStore.getState().dismissFeedback();
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  return (
    <>
      {hint ? (
        <p
          aria-live="polite"
          className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm font-bold text-amber-900"
          role="status"
        >
          {hintText(hint, discovered)}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {feedback && feedback.kind !== "new" ? (
          <m.p
            key={feedback.kind}
            animate={{ opacity: 1, y: 0 }}
            aria-live="polite"
            className="rounded-2xl border bg-muted px-3 py-2 text-center text-sm font-bold text-foreground"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 6 }}
            role="status"
            transition={{ duration: 0.18 }}
          >
            {feedbackText(feedback.kind, "elementId" in feedback ? feedback.elementId : undefined)}
          </m.p>
        ) : null}
      </AnimatePresence>
    </>
  );
}
