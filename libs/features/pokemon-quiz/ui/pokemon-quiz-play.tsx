import { useEffect } from "react";
import { getPokemon, usePokemonCry, type Pokemon } from "@entities/pokedex";
import { playSound } from "@shared/lib";
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
  const playCry = usePokemonCry();

  const target = question ? getPokemon(question.targetId) : undefined;
  const options = question
    ? question.optionIds
        .map((pokemonId) => getPokemon(pokemonId))
        .filter((pokemon): pokemon is Pokemon => Boolean(pokemon))
    : [];
  const correct = answered && question ? selectedId === question.targetId : false;

  useEffect(() => {
    if (answered && target) {
      playCry(target);
    }
  }, [answered, target, playCry]);

  if (!question || !target) {
    return null;
  }

  const handleAnswer = (pokemonId: number) => {
    const wasAnswered = usePokemonQuizStore.getState().answered;
    usePokemonQuizStore.getState().answer(pokemonId);
    const next = usePokemonQuizStore.getState();
    if (!wasAnswered && next.answered && next.question) {
      playSound(pokemonId === next.question.targetId ? "match" : "wrong");
    }
  };

  const handleNext = () => {
    playSound("tap");
    usePokemonQuizStore.getState().newQuestion();
  };

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-5 lg:items-start lg:gap-4">
      <div className="order-1 lg:col-span-3">
        <QuizArtwork answered={answered} target={target} />
      </div>

      <aside className="order-2 space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between gap-3 rounded-3xl border bg-card p-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Raad de Pokémon
            </p>
            <p className="text-base font-black leading-tight">Kies de juiste naam</p>
            <p className="text-xs text-muted-foreground">
              {correctCount} van {rounds} goed
            </p>
          </div>
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
            Kies een naam. Daarna hoor je de Pokémon.
          </p>
        )}
      </aside>
    </div>
  );
}
