import { getPokemon, type Pokemon } from "@entities/pokedex";
import { isFragmentDifficulty, isSilhouetteDifficulty } from "./quiz";
import { useQuizActions } from "./use-quiz-actions";
import { useQuizAudio } from "./use-quiz-audio";
import { usePokemonQuizStore } from "./use-pokemon-quiz-store";

/**
 * Derives everything one quiz round needs. Audio and side effects live in
 * their own hooks, so this stays a thin view model for the play component.
 */
export function useQuizRound() {
  const question = usePokemonQuizStore((state) => state.question);
  const selectedId = usePokemonQuizStore((state) => state.selectedId);
  const answered = usePokemonQuizStore((state) => state.answered);
  const correctCount = usePokemonQuizStore((state) => state.correctCount);
  const rounds = usePokemonQuizStore((state) => state.rounds);

  const target = question ? getPokemon(question.targetId) : undefined;
  const options = question
    ? question.optionIds
        .map((pokemonId) => getPokemon(pokemonId))
        .filter((pokemon): pokemon is Pokemon => Boolean(pokemon))
    : [];
  const soundMode = question?.mode === "geluid";
  const correct = answered && question ? selectedId === question.targetId : false;
  const nameMode = question?.mode === "naam";
  const silhouette = nameMode && question ? isSilhouetteDifficulty(question.difficulty) : false;
  const fragment = nameMode && question ? isFragmentDifficulty(question.difficulty) : false;

  const { preview, replay } = useQuizAudio(target, soundMode, answered, question?.seed);
  const { answer, next } = useQuizActions();

  return {
    answered,
    answer,
    correct,
    correctCount,
    fragment,
    next,
    options,
    preview,
    question,
    replay,
    rounds,
    selectedId,
    silhouette,
    soundMode,
    target,
  };
}
