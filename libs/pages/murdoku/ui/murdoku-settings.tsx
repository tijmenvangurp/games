import type { MurdokuSettings } from "@features/murdoku-game";
import { useTexts } from "@shared/i18n";
import { Button, Panel } from "@shared/ui";
import { MURDOKU_PAGE_TEXTS } from "./texts";

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
  const t = useTexts(MURDOKU_PAGE_TEXTS).settings;

  return (
    <Panel as="section" aria-labelledby="murdoku-instellingen" padding="md">
      <h2 className="font-display text-xl" id="murdoku-instellingen">
        {t.heading}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.intro}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          aria-pressed={settings.autoCross}
          className="min-h-11"
          variant={settings.autoCross ? "default" : "outline"}
          onClick={() => onAutoCross(!settings.autoCross)}
        >
          {t.autoCross}
        </Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.autoCrossNote}</p>
    </Panel>
  );
}
