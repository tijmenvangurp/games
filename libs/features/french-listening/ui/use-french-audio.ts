import { useCallback, useEffect, useRef } from "react";

/**
 * One reusable audio element for the whole lesson. Reusing it keeps playback
 * predictable on iOS and avoids overlapping clips when a child taps quickly.
 */
export function useFrenchAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((src: string, rate = 1) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    if (audio.getAttribute("src") !== src) {
      audio.src = src;
    }
    audio.playbackRate = rate;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay may be blocked; the speaker button stays available.
    });
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  return { play, stop };
}
