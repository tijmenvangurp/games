import { m } from "motion/react";
import { Badge, Button, Confetti, Dialog, Sparkles } from "@shared/ui";
import { elementFact, elementName, findRecipeFor, getElement } from "@entities/alchemy";
import { useLanguage, useTexts } from "@shared/i18n";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { ElementToken } from "./element-token";
import { alchemyTexts } from "./texts";

export function DiscoveryDialog() {
  const feedback = useAlchemyStore((state) => state.feedback);
  const dismiss = useAlchemyStore((state) => state.dismissFeedback);
  const language = useLanguage();
  const t = useTexts(alchemyTexts);

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
          {t.newDiscovery}
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
        {elementName(element.id, language)}
      </h2>

      {recipe ? (
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {elementName(recipe.a, language)} + {elementName(recipe.b, language)}
        </p>
      ) : null}

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {elementFact(element.id, language)}
      </p>

      <Button autoFocus className="mt-6 w-full" size="lg" variant="success" onClick={dismiss}>
        <Sparkles aria-hidden="true" className="size-5" />
        {t.keepDiscovering}
      </Button>
    </Dialog>
  );
}
