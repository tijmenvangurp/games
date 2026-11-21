import type { Ref } from "react";
import { Button, Panel, StatusBanner } from "@shared/ui";

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
  return (
    <Panel as="section" ref={ref} aria-labelledby="murdoku-afloop" padding="md" tabIndex={-1}>
      <h2 className="font-display text-xl" id="murdoku-afloop">
        De dief
      </h2>
      <p className="mt-1 text-base leading-relaxed">{sentence}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        De buit staat ook op de plattegrond; de kamer van de buit is omlijnd.
      </p>
      {progressMessage ? (
        <StatusBanner className="mt-2 min-h-0 py-2 text-sm font-medium" tone="success">
          {progressMessage}
        </StatusBanner>
      ) : null}
      <Button className="mt-3 min-h-11" variant="outline" onClick={onRestart}>
        Nog een keer
      </Button>
    </Panel>
  );
}
