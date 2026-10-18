import { explanationFor, type MathQuestion } from "@entities/math";
import { cn } from "@shared/lib";
import { Button, Check, Flame, Star, X } from "@shared/ui";
import { useMathStore } from "../model/use-math-store";
import { MathVisual } from "./math-visual";

type ChoiceState = "default" | "wrong" | "correct" | "muted";

interface MathHeaderProps {
  index: number;
  total: number;
  stars: number;
  streak: number;
}

function MathHeader({ index, total, stars, streak }: MathHeaderProps) {
  return (
    <header className="game-panel flex items-center justify-between px-3 py-2">
      <p className="text-sm font-black text-muted-foreground">
        Som {index + 1} van {total}
      </p>
      <div className="flex items-center gap-3 text-sm font-bold">
        <span aria-label={`${stars} sterren`} className="inline-flex items-center gap-1">
          <Star aria-hidden="true" className="size-4 fill-warning text-warning" />
          {stars}
        </span>
        {streak > 0 ? (
          <span aria-label={`${streak} op een rij`} className="inline-flex items-center gap-1">
            <Flame aria-hidden="true" className="size-4 text-warning" />
            {streak}
          </span>
        ) : null}
      </div>
    </header>
  );
}

function ChoiceButton({
  value,
  state,
  onSelect,
}: {
  value: number;
  state: ChoiceState;
  onSelect: () => void;
}) {
  return (
    <button
      aria-label={`Antwoord ${value}`}
      className={cn(
        "flex min-h-14 items-center justify-center gap-1 rounded-lg border text-2xl font-black transition active:scale-[0.99]",
        state === "default" && "border-border bg-card hover:bg-muted",
        state === "wrong" && "border-danger/40 bg-danger/10 text-danger",
        state === "correct" && "border-success/40 bg-success/10 text-success",
        state === "muted" && "border-border bg-muted text-muted-foreground opacity-50",
      )}
      disabled={state !== "default"}
      type="button"
      onClick={onSelect}
    >
      {value}
      {state === "correct" ? <Check aria-hidden="true" className="size-5" /> : null}
      {state === "wrong" ? <X aria-hidden="true" className="size-5" /> : null}
    </button>
  );
}

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
  return (
    <div aria-label="Kies het juiste antwoord" className="grid grid-cols-3 gap-2" role="group">
      {question.choices.map((choice) => {
        const isWrong = wrongChoices.includes(choice);
        const state: ChoiceState =
          answered && choice === question.answer
            ? "correct"
            : isWrong
              ? "wrong"
              : answered
                ? "muted"
                : "default";

        return (
          <ChoiceButton
            key={choice}
            state={state}
            value={choice}
            onSelect={() => onSelect(choice)}
          />
        );
      })}
    </div>
  );
}

function MathFeedback({
  question,
  answered,
  correct,
  wrongCount,
}: {
  question: MathQuestion;
  answered: boolean;
  correct: boolean;
  wrongCount: number;
}) {
  if (!answered) {
    return (
      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {wrongCount > 0 ? "Bijna! Probeer nog één keer." : "Kies het juiste antwoord."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p
        aria-live="polite"
        className={cn("text-center text-sm font-bold", correct ? "text-success" : "text-danger")}
      >
        {correct ? "Goed gerekend!" : `Het juiste antwoord is ${question.answer}.`}
      </p>
      <MathVisual question={question} />
      <p className="text-center text-sm font-semibold text-muted-foreground">
        {explanationFor(question)}
      </p>
    </div>
  );
}

function QuestionCard({
  question,
  wrongChoices,
  answered,
  correct,
  isLast,
}: {
  question: MathQuestion;
  wrongChoices: readonly number[];
  answered: boolean;
  correct: boolean;
  isLast: boolean;
}) {
  return (
    <section className="game-panel p-4 sm:p-6">
      <p className="text-center text-4xl font-black tracking-tight sm:text-5xl">
        {question.prompt} = ?
      </p>

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
          {isLast ? "Klaar" : "Volgende"}
        </Button>
      ) : null}
    </section>
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

  if (!round) {
    return null;
  }

  const question = round.questions[questionIndex];
  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <MathHeader
        index={questionIndex}
        stars={stars}
        streak={streak}
        total={round.questions.length}
      />
      <QuestionCard
        answered={answered}
        correct={correct}
        isLast={questionIndex + 1 >= round.questions.length}
        question={question}
        wrongChoices={wrongChoices}
      />
    </div>
  );
}
