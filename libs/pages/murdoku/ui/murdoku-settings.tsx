import type { MurdokuSettings } from "@features/murdoku-game";
import { Button } from "@shared/ui";

interface MurdokuSettingsSectionProps {
  settings: MurdokuSettings;
  onAutoCross: (enabled: boolean) => void;
  onCrossOnBlocked: (enabled: boolean) => void;
}

/**
 * De twee instellingen van Wie was het?. Ze gelden voor elke zaak en worden
 * lokaal bewaard, zodat een kind ze niet elke keer opnieuw hoeft te kiezen.
 * De knoppen zijn echte schakelaars: `aria-pressed` vertelt de stand.
 */
export function MurdokuSettingsSection({
  settings,
  onAutoCross,
  onCrossOnBlocked,
}: MurdokuSettingsSectionProps) {
  return (
    <section aria-labelledby="murdoku-instellingen" className="game-panel p-4 sm:p-5">
      <h2 className="font-display text-xl" id="murdoku-instellingen">
        Zo speel ik
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Een kruisje betekent: hier kan niemand staan. Deze keuzes gelden voor elke zaak en blijven
        bewaard.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          aria-pressed={settings.autoCross}
          className="min-h-11"
          variant={settings.autoCross ? "default" : "outline"}
          onClick={() => onAutoCross(!settings.autoCross)}
        >
          Rij en kolom automatisch wegstrepen
        </Button>
        <Button
          aria-pressed={settings.crossOnBlocked}
          className="min-h-11"
          variant={settings.crossOnBlocked ? "default" : "outline"}
          onClick={() => onCrossOnBlocked(!settings.crossOnBlocked)}
        >
          Ook kruisjes op meubels
        </Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Automatisch wegstrepen zet zelf een kruisje in de rij en kolom van iemand die je plaatst.
        Met de tweede keuze kun je meubels wegstrepen, al kan daar niemand staan.
      </p>
    </section>
  );
}
