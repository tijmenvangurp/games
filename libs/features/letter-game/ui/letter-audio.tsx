import { useEffect, useRef } from "react";
import { Button, Volume2 } from "@shared/ui";

interface LetterAudioProps {
  src: string;
  label: string;
  autoPlay?: boolean;
  /** Alleen het luidspreker-icoon; handig naast een losse letter. */
  compact?: boolean;
}

export function LetterAudio({ src, label, autoPlay = true, compact = false }: LetterAudioProps) {
  const ref = useRef<HTMLAudioElement>(null);

  const play = () => {
    const audio = ref.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay may be blocked; the button is the fallback.
    });
  };

  useEffect(() => {
    if (!autoPlay) {
      return;
    }
    const audio = ref.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // The child can always use the Luister button.
    });
  }, [autoPlay, src]);

  return (
    <div className="flex flex-col items-center gap-2">
      <audio ref={ref} preload="auto" src={src} />
      <Button aria-label={label} size={compact ? "icon" : "lg"} variant="outline" onClick={play}>
        <Volume2 aria-hidden="true" className="size-5" />
        {compact ? null : "Luister"}
      </Button>
    </div>
  );
}
