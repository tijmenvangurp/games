import {
  explanationFor,
  mathFeedbackSpeech,
  mathQuestionSpeech,
  praiseText,
  type MathQuestion,
} from "@entities/math";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import {
  AnswerOption,
  Button,
  Panel,
  ScoreHeader,
  SpeechButton,
  type AnswerState,
} from "@shared/ui";
import { useMathSpeech } from "../model/use-math-speech";
import { mathTrainerTexts } from "../model/texts";
import { useMathStore } from "../model/use-math-store";
import { MathVisual } from "./math-visual";

function MathChoices({
  question,
  wrongChoices,
  answered,
  onSelect,
}: {
  question: MathQuestion;
  wrongChoices: readonly number[];
  answered: boolean;
  onSelect: (choice: number) => void;
}) {
  const t = useTexts(mathTrainerTexts);
  return (
    <div aria-label={t.chooseLabel} className="grid grid-cols-3 gap-2" role="group">
      {question.choices.map((choice) => {
        const isWrong = wrongChoices.includes(choice);
        const state: AnswerState =
          answered && choice === question.answer
            ? "correct"
            : isWrong
              ? "warn"
              : answered
                ? "muted"
                : "default";

        return (
          <AnswerOption
            key={choice}
            aria-label={t.answer(choice)}
            className="tabular-nums"
            size="lg"
            state={state}
            onClick={() => onSelect(choice)}
          >
            {choice}
          </AnswerOption>
        );
      })}
    </div>
  );
}

function MathFeedback({
  question,
  seed,
  answered,
  correct,
  wrongCount,
}: {
  question: MathQuestion;
  seed: number;
  answered: boolean;
  correct: boolean;
  wrongCount: number;
}) {
  const t = useTexts(mathTrainerTexts);
  if (!answered) {
    return (
      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {wrongCount > 0 ? t.almost : t.choose}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        <p
          aria-live="polite"
          className={cn(
            "text-center text-sm font-bold",
            correct ? "text-success-ink" : "text-warning-ink",
          )}
        >
          {correct ? praiseText(seed, question) : t.correctAnswer(question.answer)}
        </p>
        <SpeechButton label={t.listenAnswer} line={mathFeedbackSpeech(question, correct, seed)} />
      </div>
      <MathVisual question={question} />
      <p className="text-center text-sm font-semibold text-muted-foreground">
        {explanationFor(question)}
      </p>
    </div>
  );
}

function QuestionCard({
  question,
  seed,
  wrongChoices,
  answered,
  correct,
  isLast,
}: {
  question: MathQuestion;
  seed: number;
  wrongChoices: readonly number[];
  answered: boolean;
  correct: boolean;
  isLast: boolean;
}) {
  const t = useTexts(mathTrainerTexts);
  return (
    <Panel as="section" padding="lg">
      <div className="flex items-center justify-center gap-1">
        <p className="text-center text-4xl font-black tracking-tight tabular-nums sm:text-5xl">
          {question.prompt} = ?
        </p>
        <SpeechButton label={t.listenQuestion} line={mathQuestionSpeech(question)} />
      </div>

      <div className="mt-5">
        <MathChoices
          answered={answered}
          question={question}
          wrongChoices={wrongChoices}
          onSelect={(choice) => useMathStore.getState().chooseAnswer(choice)}
        />
      </div>

      <div className="mt-4">
        <MathFeedback
          answered={answered}
          correct={correct}
          question={question}
          seed={seed}
          wrongCount={wrongChoices.length}
        />
      </div>

      {answered ? (
        <Button
          className="mt-4 w-full"
          size="lg"
          variant="success"
          onClick={() => useMathStore.getState().next()}
        >
          {isLast ? t.done : t.next}
        </Button>
      ) : null}
    </Panel>
  );
}

export function MathPlay() {
  const round = useMathStore((state) => state.round);
  const questionIndex = useMathStore((state) => state.questionIndex);
  const wrongChoices = useMathStore((state) => state.wrongChoices);
  const answered = useMathStore((state) => state.answered);
  const correct = useMathStore((state) => state.correct);
  const stars = useMathStore((state) => state.stars);
  const streak = useMathStore((state) => state.streak);
  const question = round?.questions[questionIndex];
  const t = useTexts(mathTrainerTexts);

  useMathSpeech({ round, question, answered, correct, wrongChoices });

  if (!round) {
    return null;
  }

  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <ScoreHeader
        progress={t.progress(questionIndex + 1, round.questions.length)}
        stars={stars}
        streak={streak}
      />
      <QuestionCard
        answered={answered}
        correct={correct}
        isLast={questionIndex + 1 >= round.questions.length}
        question={question}
        seed={round.seed}
        wrongChoices={wrongChoices}
      />
    </div>
  );
}
