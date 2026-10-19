import { useQuizRound } from "../model/use-quiz-round";
import { QUIZ_PLAY_COPY } from "./quiz-copy";
import { QuizArtwork } from "./quiz-artwork";
import { QuizFeedback } from "./quiz-feedback";
import { QuizOptions } from "./quiz-options";
import { QuizSoundPrompt } from "./quiz-sound-prompt";

export function PokemonQuizPlay() {
  const round = useQuizRound();

  if (!round.question || !round.target) {
    return null;
  }

  const {
    answered,
    answer,
    correct,
    correctCount,
    fragment,
    next,
    options,
    preview,
    replay,
    rounds,
    selectedId,
    silhouette,
    soundMode,
    target,
  } = round;
  const copy = QUIZ_PLAY_COPY[round.question.mode];

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-5 lg:items-start lg:gap-4">
      <div className="order-1 lg:col-span-3">
        {soundMode ? (
          <QuizSoundPrompt answered={answered} target={target} onReplay={replay} />
        ) : (
          <QuizArtwork
            answered={answered}
            fragment={fragment}
            silhouette={silhouette}
            target={target}
          />
        )}
      </div>

      <aside className="order-2 space-y-3 lg:col-span-2">
        <div className="game-panel flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {copy.eyebrow}
            </p>
            <p className="text-base font-black leading-tight">{copy.prompt}</p>
            <p className="text-xs text-muted-foreground">
              {correctCount} van {rounds} goed
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black leading-none">{rounds}</p>
            <p className="text-xs text-muted-foreground">rondes</p>
          </div>
        </div>

        <QuizOptions
          answered={answered}
          mode={round.question.mode}
          options={options}
          selectedId={selectedId}
          targetId={target.id}
          onPreview={preview}
          onSelect={answer}
        />

        {answered ? (
          <QuizFeedback correct={correct} targetName={target.name} onNext={next} />
        ) : (
          <p aria-live="polite" className="text-center text-xs text-muted-foreground">
            {copy.hint}
          </p>
        )}
      </aside>
    </div>
  );
}
