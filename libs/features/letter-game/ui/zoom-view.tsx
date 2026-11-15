import { useEffect, useRef } from "react";
import { LETTER_BY_ID, type LetterId, type ZoemQuestion } from "@entities/letter";
import { cn } from "@shared/lib";
import { useLetterStore } from "../model/use-letter-store";

export function ZoomView({
  question,
  answered,
  filled,
}: {
  question: ZoemQuestion;
  answered: boolean;
  filled: readonly LetterId[];
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const play = (src: string) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.src = src;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // The child can always tap another letter or use the replay button.
    });
  };

  useEffect(() => {
    if (!answered) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      audio.src = question.word.audio;
      audio.currentTime = 0;
      void audio.play().catch(() => {
        // The replay button is the fallback.
      });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [answered, question.word.audio]);

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <p className="text-center text-sm font-semibold text-muted-foreground">
        Lees het woord. Tik de letters van links naar rechts.
      </p>

      <div aria-label="Lees het woord" className="mt-4 flex justify-center gap-2" role="group">
        {question.word.letters.map((letter, index) => {
          const done = index < filled.length;
          const next = !answered && index === filled.length;
          return (
            <button
              key={`${letter}-${index}`}
              aria-label={`Letter ${letter}`}
              className={cn(
                "flex size-16 items-center justify-center rounded-xl border-2 text-3xl font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
                next && "border-primary/60",
              )}
              disabled={answered}
              type="button"
              onClick={() => {
                play(LETTER_BY_ID[letter].sound);
                useLetterStore.getState().submitZoom(index);
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </>
  );
}
