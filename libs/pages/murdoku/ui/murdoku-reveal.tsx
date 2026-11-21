import type { Ref } from "react";
import { useTexts } from "@shared/i18n";
import { Button, Panel, StatusBanner } from "@shared/ui";
import { MURDOKU_PAGE_TEXTS } from "./texts";

interface MurdokuRevealProps {
  /** De afloopzin met de dief en de kamer van de buit. */
  sentence: string;
  /** Wat het niveau na deze zaak doet; `null` als het gelijk blijft. */
  progressMessage?: string | null;
  /** De viering kan de focus hierheen verplaatsen als hij dichtgaat. */
  ref?: Ref<HTMLElement>;
  onRestart: () => void;
}

/**
 * De onthulling na een goede controle: de dief, de kamer van de buit en een
 * rustige manier om opnieuw te beginnen. Het bord erboven toont de buit en
 * omlijnt de kamer waar hij lag.
 */
export function MurdokuReveal({
  sentence,
  progressMessage = null,
  ref,
  onRestart,
}: MurdokuRevealProps) {
  const t = useTexts(MURDOKU_PAGE_TEXTS).revealPanel;

  return (
    <Panel as="section" ref={ref} aria-labelledby="murdoku-afloop" padding="md" tabIndex={-1}>
      <h2 className="font-display text-xl" id="murdoku-afloop">
        {t.heading}
      </h2>
      <p className="mt-1 text-base leading-relaxed">{sentence}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.note}</p>
      {progressMessage ? (
        <StatusBanner className="mt-2 min-h-0 py-2 text-sm font-medium" tone="success">
          {progressMessage}
        </StatusBanner>
      ) : null}
      <Button className="mt-3 min-h-11" variant="outline" onClick={onRestart}>
        {t.again}
      </Button>
    </Panel>
  );
}
