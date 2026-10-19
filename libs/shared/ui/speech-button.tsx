import type { SpeechLine } from "@shared/lib";
import { speak } from "@shared/lib";
import { Button } from "./button";
import { Ear } from "./icons";

interface SpeechButtonProps {
  line: SpeechLine | readonly SpeechLine[];
  label: string;
  className?: string;
}

/** Speelt een regel of reeks opnieuw. De tekst blijft zichtbaar in de UI. */
export function SpeechButton({ line, label, className }: SpeechButtonProps) {
  return (
    <Button
      aria-label={label}
      className={className}
      size="icon"
      title={label}
      variant="ghost"
      onClick={() => {
        void speak(line);
      }}
    >
      <Ear aria-hidden="true" className="size-5" />
    </Button>
  );
}
