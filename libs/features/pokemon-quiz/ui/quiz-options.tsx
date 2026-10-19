import type { Pokemon } from "@entities/pokedex";
import type { QuizMode } from "../model/quiz";
import { QUIZ_PLAY_COPY } from "./quiz-copy";
import { QuizOption } from "./quiz-option";
import { QuizPictureOption } from "./quiz-picture-option";
import { QuizSoundOption } from "./quiz-sound-option";

interface QuizOptionsProps {
  mode: QuizMode;
  options: Pokemon[];
  answered: boolean;
  selectedId: number | null;
  targetId: number;
  onPreview: (pokemon: Pokemon) => void;
  onSelect: (pokemonId: number) => void;
}

export function QuizOptions({
  mode,
  options,
  answered,
  selectedId,
  targetId,
  onPreview,
  onSelect,
}: QuizOptionsProps) {
  const label = QUIZ_PLAY_COPY[mode].prompt;
  const layout = mode === "geluid" ? "grid grid-cols-2 gap-2" : "grid gap-2";

  return (
    <div aria-label={label} className={layout} role="group">
      {mode === "geluid"
        ? options.map((option, index) => (
            <QuizPictureOption
              key={option.id}
              answered={answered}
              index={index}
              option={option}
              selectedId={selectedId}
              targetId={targetId}
              onSelect={onSelect}
            />
          ))
        : mode === "plaatje"
          ? options.map((option, index) => (
              <QuizSoundOption
                key={option.id}
                answered={answered}
                index={index}
                option={option}
                selectedId={selectedId}
                targetId={targetId}
                onPreview={onPreview}
                onSelect={onSelect}
              />
            ))
          : options.map((option, index) => (
              <QuizOption
                key={option.id}
                answered={answered}
                index={index}
                option={option}
                selectedId={selectedId}
                targetId={targetId}
                onSelect={onSelect}
              />
            ))}
    </div>
  );
}
