import type { ReactNode } from "react";
import type { SpeechLine } from "@shared/lib";
import { useAutoSpeech } from "@shared/lib";
import { cn } from "@shared/lib";
import { SpeechButton } from "./speech-button";

interface SpokenTextProps {
  line: SpeechLine | readonly SpeechLine[];
  /** Afwijkende zichtbare tekst; standaard de tekst uit de catalogus. */
  children?: ReactNode;
  text?: string;
  label?: string;
  autoPlay?: boolean;
  className?: string;
}

function isLineArray(line: SpeechLine | readonly SpeechLine[]): line is readonly SpeechLine[] {
  return Array.isArray(line);
}

function lineText(line: SpeechLine | readonly SpeechLine[], text?: string): ReactNode {
  if (text) {
    return text;
  }
  return isLineArray(line) ? line.map((item) => item.text).join(" ") : line.text;
}

function speechKey(line: SpeechLine | readonly SpeechLine[]): string {
  return isLineArray(line) ? line.map((item) => item.id).join("|") : `${line.folder}:${line.id}`;
}

export function SpokenText({
  line,
  children,
  text,
  label = "Beluister de tekst",
  autoPlay = false,
  className,
}: SpokenTextProps) {
  useAutoSpeech(speechKey(line), autoPlay ? line : null);

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <span className="min-w-0">{children ?? lineText(line, text)}</span>
      <SpeechButton className="shrink-0" label={label} line={line} />
    </span>
  );
}
