import { m } from "motion/react";
import { Badge, Button, Confetti, Dialog, Sparkles } from "@shared/ui";
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
    <Dialog
      className="text-center"
      labelledBy="discovery-title"
      overlay={<Confetti pieces={32} variant="stars" />}
      size="sm"
      onClose={dismiss}
    >
      <div className="flex justify-center">
        <Badge tone="success">
          <Sparkles aria-hidden="true" className="size-3.5" />
          Nieuw ontdekt
        </Badge>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="relative">
          <m.div
            aria-hidden="true"
            animate={{ opacity: [0, 0.45, 0.2], scale: [0.8, 1.2, 1.08] }}
            className="absolute inset-0 rounded-full bg-warning/50 blur-2xl"
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

      <h2 className="mt-3 font-display text-3xl tracking-tight" id="discovery-title">
        {element.name}
      </h2>

      {recipe ? (
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {elementName(recipe.a)} + {elementName(recipe.b)}
        </p>
      ) : null}

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{element.fact}</p>

      <Button autoFocus className="mt-6 w-full" size="lg" variant="success" onClick={dismiss}>
        <Sparkles aria-hidden="true" className="size-5" />
        Verder ontdekken
      </Button>
    </Dialog>
  );
}
