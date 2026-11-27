import { useTranslation } from "@shared/i18n";
import { toggleSound, useSoundEnabled } from "@shared/lib";
import { Button } from "./button";
import { Volume2, VolumeX } from "./icons";

export function SoundToggle() {
  const enabled = useSoundEnabled();
  const { t } = useTranslation();
  const label = enabled ? t("shell.soundOff") : t("shell.soundOn");

  return (
    <Button
      aria-label={label}
      aria-pressed={enabled}
      size="icon"
      title={label}
      variant="ghost"
      onClick={toggleSound}
    >
      {enabled ? (
        <Volume2 aria-hidden="true" className="size-5" />
      ) : (
        <VolumeX aria-hidden="true" className="size-5" />
      )}
    </Button>
  );
}
