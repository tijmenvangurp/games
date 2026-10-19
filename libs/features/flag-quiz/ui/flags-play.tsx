import {
  directionPrompt,
  explanationFor,
  flagSrc,
  type FlagQuestion,
  type FlagScope,
} from "@entities/geography";
import { cn } from "@shared/lib";
import { Button, Check, X } from "@shared/ui";
import { useFlagStore } from "../model/use-flags-store";
import { PlaceMap } from "./place-map";

type ChoiceState = "default" | "wrong" | "correct" | "muted";

function FlagPicture({ code, className }: { code: string; className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn("aspect-4/3 w-full rounded-xl border object-cover", className)}
      height={480}
      src={flagSrc({ code })}
      width={640}
    />
  );
}

function ChoiceMark({ state }: { state: ChoiceState }) {
  if (state === "correct") {
    return <Check aria-hidden="true" className="size-5 shrink-0 text-emerald-600" />;
  }
  if (state === "wrong") {
    return <X aria-hidden="true" className="size-5 shrink-0 text-rose-500" />;
  }
  return null;
}

const CHOICE_CLASSES: Record<ChoiceState, string> = {
  default: "border-border bg-card hover:bg-muted",
  wrong: "border-rose-300 bg-rose-50",
  correct: "border-emerald-400 bg-emerald-50",
  muted: "border-border bg-muted opacity-50",
};

interface ChoiceProps {
  subject: { code: string; name: string };
  state: ChoiceState;
  onSelect: () => void;
}

function NameChoice({ subject, state, onSelect }: ChoiceProps) {
  return (
    <button
      aria-label={subject.name}
      className={cn(
        "flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-3 text-base font-bold transition active:scale-95",
        CHOICE_CLASSES[state],
      )}
      disabled={state !== "default"}
      type="button"
      onClick={onSelect}
    >
      {subject.name}
      <ChoiceMark state={state} />
    </button>
  );
}

function FlagChoice({ subject, state, onSelect }: ChoiceProps) {
  return (
    <button
      aria-label={subject.name}
      className={cn(
        "flex min-h-16 items-center justify-center gap-1 rounded-2xl border-2 p-2 transition active:scale-95",
        CHOICE_CLASSES[state],
      )}
      disabled={state !== "default"}
      type="button"
      onClick={onSelect}
    >
      <FlagPicture code={subject.code} />
      <ChoiceMark state={state} />
    </button>
  );
}

function choiceState(
  question: FlagQuestion,
  code: string,
  wrongChoices: readonly string[],
  answered: boolean,
): ChoiceState {
  if (answered && code === question.subject.code) {
    return "correct";
  }
  if (wrongChoices.includes(code)) {
    return "wrong";
  }
  return answered ? "muted" : "default";
}

function FlagChoices({
  question,
  wrongChoices,
  answered,
}: {
  question: FlagQuestion;
  wrongChoices: readonly string[];
  answered: boolean;
}) {
  const columns =
    question.direction === "vlag-naar-land"
      ? "grid-cols-1 sm:grid-cols-2"
      : question.choices.length === 3
        ? "grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <div aria-label="Kies het juiste antwoord" className={cn("grid gap-2", columns)} role="group">
      {question.choices.map((subject) => {
        const state = choiceState(question, subject.code, wrongChoices, answered);
        const select = () => useFlagStore.getState().chooseAnswer(subject.code);

        return question.direction === "vlag-naar-land" ? (
          <NameChoice key={subject.code} subject={subject} state={state} onSelect={select} />
        ) : (
          <FlagChoice key={subject.code} subject={subject} state={state} onSelect={select} />
        );
      })}
    </div>
  );
}

function FlagFeedback({
  question,
  answered,
  correct,
}: {
  question: FlagQuestion;
  answered: boolean;
  correct: boolean;
}) {
  if (!answered) {
    return (
      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        Kies het juiste antwoord.
      </p>
    );
  }

  const message = correct
    ? "Goed zo!"
    : question.direction === "vlag-naar-land"
      ? `Het juiste antwoord is ${question.subject.name}.`
      : `De juiste vlag is de vlag van ${question.subject.name}.`;

  return (
    <div className="space-y-2">
      <p
        aria-live="polite"
        className={cn(
          "text-center text-sm font-bold",
          correct ? "text-emerald-700" : "text-rose-600",
        )}
      >
        {message}
      </p>
      <p className="text-center text-sm font-semibold text-muted-foreground">
        {explanationFor(question)}
      </p>
      <PlaceMap subject={question.subject} />
    </div>
  );
}

function QuestionCard({
  question,
  isLast,
  scope,
}: {
  question: FlagQuestion;
  isLast: boolean;
  scope: FlagScope;
}) {
  const wrongChoices = useFlagStore((state) => state.wrongChoices);
  const answered = useFlagStore((state) => state.answered);
  const correct = useFlagStore((state) => state.correct);
  const showsFlag = question.direction === "vlag-naar-land";

  return (
    <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
      <p className="text-center text-sm font-bold text-muted-foreground">
        {directionPrompt(question.direction, scope)}
      </p>

      {showsFlag ? (
        <div className="mx-auto mt-3 max-w-xs">
          <FlagPicture className="bg-white" code={question.subject.code} />
        </div>
      ) : (
        <p className="mt-3 text-center text-3xl font-black tracking-tight sm:text-4xl">
          {question.subject.name}
        </p>
      )}

      <div className="mt-4">
        <FlagChoices answered={answered} question={question} wrongChoices={wrongChoices} />
      </div>

      <div className="mt-4">
        <FlagFeedback answered={answered} correct={correct} question={question} />
      </div>

      {answered ? (
        <Button
          className="mt-4 w-full"
          size="lg"
          variant="success"
          onClick={() => useFlagStore.getState().next()}
        >
          {isLast ? "Klaar" : "Volgende"}
        </Button>
      ) : null}
    </section>
  );
}

export function FlagsPlay() {
  const round = useFlagStore((state) => state.round);
  const questionIndex = useFlagStore((state) => state.questionIndex);
  const stars = useFlagStore((state) => state.stars);
  const streak = useFlagStore((state) => state.streak);

  const question = round?.questions[questionIndex];
  if (!round || !question) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <header className="flex items-center justify-between rounded-2xl border bg-card px-3 py-2 shadow-sm">
        <p className="text-sm font-black text-muted-foreground">
          Vraag {questionIndex + 1} van {round.questions.length}
        </p>
        <div className="flex items-center gap-3 text-sm font-bold">
          <span aria-label={`${stars} sterren`}>⭐ {stars}</span>
          {streak > 0 ? <span aria-label={`${streak} op een rij`}>🔥 {streak}</span> : null}
        </div>
      </header>
      <QuestionCard
        isLast={questionIndex + 1 >= round.questions.length}
        question={question}
        scope={round.scope}
      />
    </div>
  );
}
