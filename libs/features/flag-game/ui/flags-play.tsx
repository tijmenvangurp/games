import {
  directionPrompt,
  explanationFor,
  flagSrc,
  subjectName,
  subjectNameInSentence,
  type FlagQuestion,
  type FlagScope,
} from "@entities/geography";
import { useLanguage, useTexts } from "@shared/i18n";
import { cn, praiseFor } from "@shared/lib";
import { AnswerOption, Button, Flag, Panel, ScoreHeader, type AnswerState } from "@shared/ui";
import { flagTexts } from "../model/texts";
import { useFlagStore } from "../model/use-flags-store";
import { PlaceMap } from "./place-map";

function FlagPicture({ code, className }: { code: string; className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn(
        "aspect-4/3 h-auto w-full rounded-xl border border-border object-cover",
        className,
      )}
      height={480}
      src={flagSrc({ code })}
      width={640}
    />
  );
}

interface ChoiceProps {
  subject: { code: string; name: string };
  state: AnswerState;
  /** Dense layout for levels with many choices, such as all twelve provinces. */
  compact: boolean;
  onSelect: () => void;
}

function NameChoice({ subject, state, compact, onSelect }: ChoiceProps) {
  const name = subjectName(subject, useLanguage());

  return (
    <AnswerOption aria-label={name} size={compact ? "sm" : "md"} state={state} onClick={onSelect}>
      {name}
    </AnswerOption>
  );
}

function FlagChoice({ subject, state, compact, onSelect }: ChoiceProps) {
  const name = subjectName(subject, useLanguage());

  return (
    <AnswerOption
      aria-label={name}
      className={compact ? "min-h-14 gap-1 p-1" : "min-h-16 gap-1 p-2"}
      state={state}
      onClick={onSelect}
    >
      <FlagPicture code={subject.code} />
    </AnswerOption>
  );
}

function choiceState(
  question: FlagQuestion,
  code: string,
  wrongChoices: readonly string[],
  answered: boolean,
): AnswerState {
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
  const t = useTexts(flagTexts);
  const count = question.choices.length;
  const compact = count > 6;
  const columns =
    question.direction === "vlag-naar-land"
      ? compact
        ? "grid-cols-2 sm:grid-cols-3"
        : count === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2"
      : compact
        ? "grid-cols-4 sm:grid-cols-6"
        : count === 3
          ? "grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";

  return (
    <div aria-label={t.chooseAnswer} className={cn("grid gap-2", columns)} role="group">
      {question.choices.map((subject) => {
        const state = choiceState(question, subject.code, wrongChoices, answered);
        const select = () => useFlagStore.getState().chooseAnswer(subject.code);

        return question.direction === "vlag-naar-land" ? (
          <NameChoice
            key={subject.code}
            compact={compact}
            state={state}
            subject={subject}
            onSelect={select}
          />
        ) : (
          <FlagChoice
            key={subject.code}
            compact={compact}
            state={state}
            subject={subject}
            onSelect={select}
          />
        );
      })}
    </div>
  );
}

function FlagFeedback({
  question,
  answered,
  correct,
  praise,
}: {
  question: FlagQuestion;
  answered: boolean;
  correct: boolean;
  praise: string;
}) {
  const language = useLanguage();
  const t = useTexts(flagTexts);

  if (!answered) {
    return (
      <Panel
        className="flex flex-col items-center justify-center gap-2 text-center lg:min-h-64"
        padding="lg"
        surface="subtle"
      >
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-full bg-card text-primary shadow-xs"
        >
          <Flag className="size-5" />
        </span>
        <p aria-live="polite" className="text-sm font-semibold text-muted-foreground">
          {t.chooseAnswerHint}
        </p>
      </Panel>
    );
  }

  const answer = subjectNameInSentence(question.subject, language);
  const message = correct
    ? praise
    : question.direction === "vlag-naar-land"
      ? t.rightAnswer(answer)
      : t.rightFlag(answer);

  return (
    <div className="space-y-2">
      <p
        aria-live="polite"
        className={cn(
          "text-center text-sm font-bold",
          correct ? "text-success-ink" : "text-danger-ink",
        )}
      >
        {message}
      </p>
      <p className="text-center text-sm font-semibold text-muted-foreground">
        {explanationFor(question, language)}
      </p>
      <PlaceMap subject={question.subject} />
    </div>
  );
}

function QuestionCard({
  question,
  isLast,
  praise,
  scope,
}: {
  question: FlagQuestion;
  isLast: boolean;
  praise: string;
  scope: FlagScope;
}) {
  const wrongChoices = useFlagStore((state) => state.wrongChoices);
  const answered = useFlagStore((state) => state.answered);
  const correct = useFlagStore((state) => state.correct);
  const showsFlag = question.direction === "vlag-naar-land";
  const language = useLanguage();
  const t = useTexts(flagTexts);

  return (
    <Panel as="section" padding="lg">
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div>
          <p className="text-center text-sm font-bold text-muted-foreground">
            {directionPrompt(question.direction, scope, language)}
          </p>

          {showsFlag ? (
            <div className="mx-auto mt-3 max-w-sm">
              <FlagPicture className="bg-card" code={question.subject.code} />
            </div>
          ) : (
            <p className="mt-3 text-center font-display text-3xl tracking-tight sm:text-4xl">
              {subjectName(question.subject, language)}
            </p>
          )}

          <div className="mt-4">
            <FlagChoices answered={answered} question={question} wrongChoices={wrongChoices} />
          </div>
        </div>

        <div className="mt-4 lg:mt-0">
          <FlagFeedback answered={answered} correct={correct} praise={praise} question={question} />

          {answered ? (
            <Button
              className="mt-4 w-full"
              size="lg"
              variant="success"
              onClick={() => useFlagStore.getState().next()}
            >
              {isLast ? t.done : t.next}
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export function FlagsPlay() {
  const round = useFlagStore((state) => state.round);
  const questionIndex = useFlagStore((state) => state.questionIndex);
  const stars = useFlagStore((state) => state.stars);
  const streak = useFlagStore((state) => state.streak);
  const t = useTexts(flagTexts);

  const question = round?.questions[questionIndex];
  if (!round || !question) {
    return null;
  }

  return (
    <div className="mx-auto my-auto flex w-full max-w-2xl flex-col gap-3 lg:max-w-4xl">
      <ScoreHeader
        progress={t.question(questionIndex + 1, round.questions.length)}
        stars={stars}
        streak={streak}
      />
      <QuestionCard
        isLast={questionIndex + 1 >= round.questions.length}
        praise={praiseFor(round.seed, questionIndex)}
        question={question}
        scope={round.scope}
      />
    </div>
  );
}
