import { toggleSpeech, useSpeechEnabled } from "@shared/lib";
import { Button } from "./button";
import { Ear, EarOff } from "./icons";

export function SpeechToggle() {
  const enabled = useSpeechEnabled();

  return (
    <Button
      aria-label={enabled ? "Voorlezen uitzetten" : "Voorlezen aanzetten"}
      aria-pressed={enabled}
      size="icon"
      title={enabled ? "Voorlezen uitzetten" : "Voorlezen aanzetten"}
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
