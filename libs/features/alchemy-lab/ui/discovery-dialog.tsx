import { m } from "motion/react";
import { Button, Confetti, Sparkles } from "@shared/ui";
import { elementName, findRecipeFor, getElement } from "@entities/alchemy";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { ElementToken } from "./element-token";

export function DiscoveryDialog() {
  const feedback = useAlchemyStore((state) => state.feedback);
  const dismiss = useAlchemyStore((state) => state.dismissFeedback);

  if (!feedback || feedback.kind !== "new") {
    return null;
  }

  const element = getElement(feedback.elementId);
  if (!element) {
    return null;
  }

  const recipe = findRecipeFor(element.id);

  return (
    <m.div
      animate={{ opacity: 1 }}
      aria-labelledby="discovery-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      role="dialog"
      transition={{ duration: 0.18 }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          dismiss();
        }
      }}
    >
      <Confetti pieces={32} variant="stars" />
      <m.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-50 w-full max-w-sm rounded-3xl border bg-card p-6 text-center shadow-xl"
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ damping: 26, stiffness: 380, type: "spring" }}
      >
        <p className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-700">
          <Sparkles aria-hidden="true" className="size-4" />
          Nieuw ontdekt
        </p>

        <div className="mt-3 flex justify-center">
          <div className="relative">
            <m.div
              aria-hidden="true"
              animate={{ opacity: [0, 0.55, 0.28], scale: [0.8, 1.25, 1.1] }}
              className="absolute inset-0 rounded-full bg-amber-300 blur-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <m.div
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              initial={{ opacity: 0, rotate: -8, scale: 0.6 }}
              transition={{ damping: 18, delay: 0.06, stiffness: 320, type: "spring" }}
            >
              <ElementToken element={element} showLabel={false} variant="overlay" />
            </m.div>
          </div>
        </div>

        <h2 className="mt-2 text-3xl font-black" id="discovery-title">
          {element.name}
        </h2>

        {recipe ? (
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            {elementName(recipe.a)} + {elementName(recipe.b)}
          </p>
        ) : null}

        <p className="mt-3 text-sm text-muted-foreground">{element.fact}</p>

        <Button autoFocus className="mt-6 w-full" size="lg" variant="success" onClick={dismiss}>
          <Sparkles aria-hidden="true" className="size-5" />
          Verder ontdekken
        </Button>
      </m.div>
    </m.div>
  );
}
