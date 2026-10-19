import { playHaptic, playSound } from "@shared/lib";
import { usePokemonQuizStore } from "./use-pokemon-quiz-store";

/** Answer and next actions shared by both quiz modes. */
export function useQuizActions() {
  const answer = (pokemonId: number) => {
    const wasAnswered = usePokemonQuizStore.getState().answered;
    usePokemonQuizStore.getState().answer(pokemonId);
    const next = usePokemonQuizStore.getState();
    if (!wasAnswered && next.answered && next.question) {
      const isCorrect = pokemonId === next.question.targetId;
      playSound(isCorrect ? "match" : "wrong");
      playHaptic(isCorrect ? "match" : "wrong");
    }
  };

  const next = () => {
    playSound("tap");
    playHaptic("tap");
    usePokemonQuizStore.getState().newQuestion();
  };

  return { answer, next };
}
