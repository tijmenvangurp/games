import { useTranslation } from "@shared/i18n";
import { toggleSpeech, useRecordedSpeech, useSpeechEnabled } from "@shared/lib";
import { Button } from "./button";
import { Ear, EarOff } from "./icons";

export function SpeechToggle() {
  const enabled = useSpeechEnabled();
  const { t } = useTranslation();
  const recorded = useRecordedSpeech();
  const label = enabled ? t("shell.speechOff") : t("shell.speechOn");

  // De voorleesstem is alleen in het Nederlands opgenomen.
  if (!recorded) {
    return null;
  }

  return (
    <Button
      aria-label={label}
      aria-pressed={enabled}
      size="icon"
      title={label}
      variant="ghost"
      onClick={toggleSpeech}
    >
      {enabled ? (
        <Ear aria-hidden="true" className="size-5" />
      ) : (
        <EarOff aria-hidden="true" className="size-5" />
      )}
    </Button>
  );
}
