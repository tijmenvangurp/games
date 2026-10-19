import { useCallback, useEffect } from "react";
import { usePokemonCry, type Pokemon } from "@entities/pokedex";

/**
 * Plays the target cry on reveal and, in sound mode, as soon as a round starts.
 * Returns the shared player plus a replay callback for the speaker button.
 */
export function useQuizAudio(
  target: Pokemon | undefined,
  soundMode: boolean,
  answered: boolean,
  seed: number | undefined,
) {
  const playCry = usePokemonCry();

  useEffect(() => {
    if (answered && target) {
      playCry(target);
    }
  }, [answered, target, playCry]);

  const replay = useCallback(() => {
    if (target) {
      playCry(target);
    }
  }, [playCry, target]);

  // Starting a round or tapping "next" is a user gesture, which keeps browsers
  // happy about autoplay. The seed makes a repeated target replay too.
  useEffect(() => {
    if (soundMode && !answered) {
      replay();
    }
  }, [answered, replay, seed, soundMode]);

  return { preview: playCry, replay };
}
