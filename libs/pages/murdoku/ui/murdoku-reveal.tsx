import type { Ref } from "react";
import { Button } from "@shared/ui";

interface MurdokuRevealProps {
  /** De afloopzin met de dader en de kamer van het slachtoffer. */
  sentence: string;
  /** De viering kan de focus hierheen verplaatsen als hij dichtgaat. */
  ref?: Ref<HTMLElement>;
  onRestart: () => void;
}

/**
 * De onthulling na een goede controle: de dader, de kamer van het slachtoffer
 * en een rustige manier om opnieuw te beginnen. Het bord erboven toont het
 * slachtoffer en omlijnt haar kamer.
 */
export function MurdokuReveal({ sentence, ref, onRestart }: MurdokuRevealProps) {
  return (
    <section
      ref={ref}
      aria-labelledby="murdoku-afloop"
      className="game-panel p-4 sm:p-5"
      tabIndex={-1}
    >
      <h2 className="font-display text-xl" id="murdoku-afloop">
        De dader
      </h2>
      <p className="mt-1 text-base leading-relaxed">{sentence}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Het slachtoffer staat ook op de plattegrond; haar kamer is omlijnd.
      </p>
      <Button className="mt-3 min-h-11" variant="outline" onClick={onRestart}>
        Nog een keer
      </Button>
    </section>
  );
}
