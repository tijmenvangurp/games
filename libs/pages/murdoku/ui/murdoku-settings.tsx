import type { MurdokuSettings } from "@features/murdoku-game";
import { Button } from "@shared/ui";

interface MurdokuSettingsSectionProps {
  settings: MurdokuSettings;
  onAutoCross: (enabled: boolean) => void;
}

/**
 * De instelling van Wie was het?. Ze geldt voor elke zaak en wordt lokaal
 * bewaard, zodat een kind haar niet elke keer opnieuw hoeft te kiezen. De knop
 * is een echte schakelaar: `aria-pressed` vertelt de stand.
 */
export function MurdokuSettingsSection({ settings, onAutoCross }: MurdokuSettingsSectionProps) {
  return (
    <section aria-labelledby="murdoku-instellingen" className="game-panel p-4 sm:p-5">
      <h2 className="font-display text-xl" id="murdoku-instellingen">
        Zo speel ik
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Een kruisje betekent: hier kan niemand staan. Deze keuze geldt voor elke zaak en blijft
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
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Automatisch wegstrepen zet zelf een kruisje in de rij en kolom van iemand die je plaatst. Zo
        hoef je die vakjes niet zelf weg te strepen.
      </p>
    </section>
  );
}
