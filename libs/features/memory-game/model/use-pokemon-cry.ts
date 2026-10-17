import { useCallback, useEffect, useRef } from "react";
import type { Pokemon } from "@entities/memory";
import { pokemonCrySrc } from "./assets";

/**
 * Plays a Pokémon cry through one reused audio element.
 *
 * The audio file is local, so this stays within the strict CSP. Browsers may
 * reject playback before the first interaction; that is handled silently.
 */
export function usePokemonCry() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return useCallback((pokemon: Pokemon) => {
    try {
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      const src = pokemonCrySrc(pokemon);
      if (audio.getAttribute("src") !== src) {
        audio.src = src;
      }
      audio.currentTime = 0;
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        void playback.catch(() => {
          // Autoplay policy or unsupported codec: the game keeps working.
        });
      }
    } catch {
      // Audio is a bonus, never a requirement for play.
    }
  }, []);
}
