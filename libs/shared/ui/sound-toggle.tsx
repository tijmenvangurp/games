import { toggleSound, useSoundEnabled } from "@shared/lib";
import { Button } from "./button";
import { Volume2, VolumeX } from "./icons";

export function SoundToggle() {
  const enabled = useSoundEnabled();

  return (
    <Button
      aria-label={enabled ? "Geluid uitzetten" : "Geluid aanzetten"}
      aria-pressed={enabled}
      size="icon"
      title={enabled ? "Geluid uitzetten" : "Geluid aanzetten"}
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
