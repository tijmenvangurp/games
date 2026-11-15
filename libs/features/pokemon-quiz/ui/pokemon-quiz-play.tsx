import { getPokemon, type Pokemon } from "@entities/pokedex";
import { playHaptic, playSound } from "@shared/lib";
import { isFragmentDifficulty, isSilhouetteDifficulty } from "../model/quiz";
import { usePokemonQuizStore } from "../model/use-pokemon-quiz-store";
import { QuizArtwork } from "./quiz-artwork";
import { QuizFeedback } from "./quiz-feedback";
import { QuizOption } from "./quiz-option";

export function PokemonQuizPlay() {
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
  const correct = answered && question ? selectedId === question.targetId : false;

  if (!question || !target) {
    return null;
  }

  const handleAnswer = (pokemonId: number) => {
    const wasAnswered = usePokemonQuizStore.getState().answered;
    usePokemonQuizStore.getState().answer(pokemonId);
    const next = usePokemonQuizStore.getState();
    if (!wasAnswered && next.answered && next.question) {
      const correctAnswer = pokemonId === next.question.targetId;
      if (correctAnswer) {
        playSound("match");
        playHaptic("match");
      }
    }
  };

  const handleNext = () => {
    playSound("tap");
    playHaptic("tap");
    usePokemonQuizStore.getState().newQuestion();
  };

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-5 lg:items-start lg:gap-4">
      <div className="order-1 lg:col-span-3">
        <QuizArtwork
          answered={answered}
          fragment={isFragmentDifficulty(question.difficulty)}
          silhouette={isSilhouetteDifficulty(question.difficulty)}
          target={target}
        />
      </div>

      <aside className="order-2 space-y-3 lg:col-span-2">
        <div className="game-panel flex items-center justify-between gap-3 p-4">
          <p className="text-sm font-black">
            {correctCount} van {rounds} goed
          </p>

          <div className="text-right">
            <p className="text-3xl font-black leading-none">{rounds}</p>
            <p className="text-xs text-muted-foreground">rondes</p>
          </div>
        </div>

        <div aria-label="Kies de juiste naam" className="grid gap-2" role="group">
          {options.map((option, index) => (
            <QuizOption
              key={option.id}
              answered={answered}
              index={index}
              option={option}
              selectedId={selectedId}
              targetId={target.id}
              onSelect={handleAnswer}
            />
          ))}
        </div>

        {answered ? (
          <QuizFeedback correct={correct} targetName={target.name} onNext={handleNext} />
        ) : (
          <p aria-live="polite" className="text-center text-xs text-muted-foreground">
            Kies een naam.
          </p>
        )}
      </aside>
    </div>
  );
}
