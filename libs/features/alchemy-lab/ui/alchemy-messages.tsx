import { useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { elementName, hintIngredient, type ElementId, type Hint } from "@entities/alchemy";
import { useAlchemyStore } from "../model/use-alchemy-store";
import type { AlchemyFeedback } from "../model/use-alchemy-store";

function hintText(hint: Hint, discovered: ReadonlySet<ElementId>): string {
  // A recipe with the same ingredient twice is its own kind of hint: the child
  // cannot find that one by pairing two different elements.
  if (hint.a === hint.b) {
    return `Probeer twee keer ${elementName(hint.a)}.`;
  }

  // Name one ingredient only, so the child still has to find the partner.
  return `Probeer ${elementName(hintIngredient(hint, discovered))} met iets anders.`;
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
  const discoveredSet = new Set(discovered);

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
          {hintText(hint, discoveredSet)}
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
