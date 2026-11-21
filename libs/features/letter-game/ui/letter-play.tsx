import {
  LETTER_BY_ID,
  type JachtQuestion,
  type KlankQuestion,
  type LeesQuestion,
  type LetterId,
  type LetterQuestion,
  type LetterWord,
  type VangerQuestion,
} from "@entities/letter";
import { useTexts } from "@shared/i18n";
import { Button, Panel } from "@shared/ui";
import { useLetterStore } from "../model/use-letter-store";
import { LetterAudio } from "./letter-audio";
import { LetterTile } from "./letter-tile";
import { PlekView } from "./plek-view";
import { letterTexts, type LetterTexts } from "./texts";
import { TrainView } from "./train-view";
import { WordTile } from "./word-tile";
import { ZoomView } from "./zoom-view";

type ChoiceState = "default" | "correct" | "wrong" | "muted";

function choiceState(
  letter: LetterId,
  target: LetterId,
  answered: boolean,
  wrongChoices: readonly string[],
): ChoiceState {
  if (answered && letter === target) {
    return "correct";
  }
  if (!answered && wrongChoices.includes(letter)) {
    return "wrong";
  }
  if (answered) {
    return "muted";
  }
  return "default";
}

function wordChoiceState(
  word: LetterWord,
  target: LetterWord,
  answered: boolean,
  wrongChoices: readonly string[],
): ChoiceState {
  if (answered && word.id === target.id) {
    return "correct";
  }
  if (!answered && wrongChoices.includes(word.id)) {
    return "wrong";
  }
  if (answered) {
    return "muted";
  }
  return "default";
}

function Prompt({ children }: { children: string }) {
  return <p className="text-center text-sm font-semibold text-muted-foreground">{children}</p>;
}

function KlankView({
  question,
  answered,
  wrongChoices,
}: {
  question: KlankQuestion;
  answered: boolean;
  wrongChoices: readonly string[];
}) {
  const t = useTexts(letterTexts);
  return (
    <>
      <LetterAudio autoPlay label={t.listenSound(question.target)} src={question.sound} />
      <div className="mt-3">
        <Prompt>{t.klankPrompt}</Prompt>
      </div>
      <div aria-label={t.chooseLetter} className="mt-4 grid grid-cols-3 gap-2" role="group">
        {question.choices.map((letter) => (
          <LetterTile
            key={letter}
            disabled={answered || wrongChoices.includes(letter)}
            letter={letter}
            state={choiceState(letter, question.target, answered, wrongChoices)}
            onClick={() => useLetterStore.getState().choose(letter)}
          />
        ))}
      </div>
    </>
  );
}

function VangerView({
  question,
  answered,
  wrongChoices,
}: {
  question: VangerQuestion;
  answered: boolean;
  wrongChoices: readonly string[];
}) {
  const t = useTexts(letterTexts);
  return (
    <>
      <LetterAudio autoPlay label={t.listenWord(question.word.word)} src={question.word.audio} />
      <div className="mt-3">
        <Prompt>{t.vangerPrompt}</Prompt>
      </div>
      <div aria-label={t.chooseFirstLetter} className="mt-4 grid grid-cols-3 gap-2" role="group">
        {question.choices.map((letter) => (
          <LetterTile
            key={letter}
            disabled={answered || wrongChoices.includes(letter)}
            letter={letter}
            state={choiceState(letter, question.target, answered, wrongChoices)}
            onClick={() => useLetterStore.getState().choose(letter)}
          />
        ))}
      </div>
    </>
  );
}

function JachtView({
  question,
  answered,
  wrongChoices,
}: {
  question: JachtQuestion;
  answered: boolean;
  wrongChoices: readonly string[];
}) {
  const t = useTexts(letterTexts);
  return (
    <>
      <LetterAudio
        autoPlay
        label={t.listenSound(question.target)}
        src={LETTER_BY_ID[question.target].sound}
      />
      <div className="mt-3 text-center">
        <Prompt>{t.jachtPrompt}</Prompt>
        <p className="mt-1 text-6xl font-black text-primary">{question.target}</p>
      </div>
      <div aria-label={t.findLetter} className="mt-4 grid grid-cols-3 gap-2" role="group">
        {question.choices.map((letter) => (
          <LetterTile
            key={letter}
            disabled={answered || wrongChoices.includes(letter)}
            letter={letter}
            state={choiceState(letter, question.target, answered, wrongChoices)}
            onClick={() => useLetterStore.getState().choose(letter)}
          />
        ))}
      </div>
    </>
  );
}

function LeesView({
  question,
  answered,
  wrongChoices,
}: {
  question: LeesQuestion;
  answered: boolean;
  wrongChoices: readonly string[];
}) {
  const t = useTexts(letterTexts);
  return (
    <>
      <LetterAudio
        autoPlay
        label={t.listenWord(question.target.word)}
        src={question.target.audio}
      />
      <div className="mt-3">
        <Prompt>{t.leesPrompt}</Prompt>
      </div>
      <div aria-label={t.chooseWord} className="mt-4 grid gap-2" role="group">
        {question.choices.map((word) => (
          <WordTile
            key={word.id}
            disabled={answered || wrongChoices.includes(word.id)}
            state={wordChoiceState(word, question.target, answered, wrongChoices)}
            word={word.word}
            onClick={() => useLetterStore.getState().choose(word.id)}
          />
        ))}
      </div>
    </>
  );
}

function successMessage(t: LetterTexts, question: LetterQuestion): string {
  switch (question.kind) {
    case "klank":
      return t.success.klank(question.target);
    case "vanger":
      return t.success.vanger(question.word.word, question.target);
    case "jacht":
      return t.success.jacht(question.target);
    case "lees":
      return t.success.lees(question.target.word);
    case "plek":
      return t.success.plek(question.target, t.positions[question.position], question.word.word);
    case "zoem":
      return t.success.zoem(question.word.word);
    case "trein":
      return t.success.trein(question.word.word);
  }
}

function retryMessage(t: LetterTexts, question: LetterQuestion): string {
  switch (question.kind) {
    case "klank":
      return t.retry.klank(question.target);
    case "vanger":
      return t.retry.vanger(question.word.word, question.target);
    case "jacht":
      return t.retry.jacht(question.target);
    case "lees":
      return t.retry.lees(question.target.word);
    case "plek":
      return t.retry.plek(question.target, t.positions[question.position], question.word.word);
    case "zoem":
      return t.retry.zoem(question.word.word);
    case "trein":
      return t.retry.trein(question.word.word);
  }
}

function Feedback({
  question,
  answered,
  correct,
  wrongCount,
}: {
  question: LetterQuestion;
  answered: boolean;
  correct: boolean;
  wrongCount: number;
}) {
  const t = useTexts(letterTexts);
  if (!answered) {
    if (question.kind === "trein" && wrongCount >= 2) {
      return null;
    }
    return (
      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {wrongCount > 0 ? t.almost : t.listenAndChoose}
      </p>
    );
  }

  const message = correct ? successMessage(t, question) : retryMessage(t, question);

  const replaySrc = (() => {
    if (question.kind === "lees") {
      return question.target.audio;
    }
    if (question.kind === "plek") {
      return question.word.audio;
    }
    if (question.kind === "zoem") {
      return question.word.audio;
    }
    if (question.kind === "vanger" || question.kind === "trein") {
      return question.word.audio;
    }
    return LETTER_BY_ID[question.target].sound;
  })();

  return (
    <div className="space-y-2">
      <p
        aria-live="polite"
        className={
          correct
            ? "text-center text-sm font-bold text-success"
            : "text-center text-sm font-bold text-danger"
        }
      >
        {message}
      </p>
      <LetterAudio autoPlay={false} label={t.listenAgain} src={replaySrc} />
    </div>
  );
}

function QuestionView({
  question,
  answered,
  wrongChoices,
  filled,
  wrongLetters,
}: {
  question: LetterQuestion;
  answered: boolean;
  wrongChoices: readonly string[];
  filled: readonly LetterId[];
  wrongLetters: readonly LetterId[];
}) {
  switch (question.kind) {
    case "klank":
      return <KlankView answered={answered} question={question} wrongChoices={wrongChoices} />;
    case "vanger":
      return <VangerView answered={answered} question={question} wrongChoices={wrongChoices} />;
    case "jacht":
      return <JachtView answered={answered} question={question} wrongChoices={wrongChoices} />;
    case "lees":
      return <LeesView answered={answered} question={question} wrongChoices={wrongChoices} />;
    case "plek":
      return <PlekView answered={answered} question={question} wrongChoices={wrongChoices} />;
    case "zoem":
      return <ZoomView answered={answered} filled={filled} question={question} />;
    case "trein":
      return (
        <TrainView
          answered={answered}
          filled={filled}
          question={question}
          wrongLetters={wrongLetters}
        />
      );
  }
}

function QuestionCard({
  question,
  answered,
  correct,
  wrongChoices,
  filled,
  wrongLetters,
  isLast,
}: {
  question: LetterQuestion;
  answered: boolean;
  correct: boolean;
  wrongChoices: readonly string[];
  filled: readonly LetterId[];
  wrongLetters: readonly LetterId[];
  isLast: boolean;
}) {
  const t = useTexts(letterTexts);
  return (
    <Panel as="section" padding="lg">
      <QuestionView
        answered={answered}
        filled={filled}
        question={question}
        wrongChoices={wrongChoices}
        wrongLetters={wrongLetters}
      />

      <div className="mt-4">
        <Feedback
          answered={answered}
          correct={correct}
          question={question}
          wrongCount={question.kind === "trein" ? wrongLetters.length : wrongChoices.length}
        />
      </div>

      {answered ? (
        <Button
          className="mt-4 w-full"
          size="lg"
          variant="success"
          onClick={() => useLetterStore.getState().next()}
        >
          {isLast ? t.done : t.next}
        </Button>
      ) : null}
    </Panel>
  );
}

export function LetterPlay() {
  const round = useLetterStore((state) => state.round);
  const index = useLetterStore((state) => state.index);
  const answered = useLetterStore((state) => state.answered);
  const correct = useLetterStore((state) => state.correct);
  const wrongChoices = useLetterStore((state) => state.wrongChoices);
  const filled = useLetterStore((state) => state.filled);
  const wrongLetters = useLetterStore((state) => state.wrongLetters);
  const t = useTexts(letterTexts);

  if (!round) {
    return null;
  }

  const question = round.questions[index];
  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <Panel as="header" className="flex items-center justify-between px-3.5 py-2.5" padding="none">
        <p className="text-sm font-bold tabular-nums text-muted-foreground">
          {t.progress(t.units[round.lesson], index + 1, round.questions.length)}
        </p>
        <span className="text-sm font-bold text-primary">{t.lessons[round.lesson].title}</span>
      </Panel>
      <QuestionCard
        answered={answered}
        correct={correct}
        filled={filled}
        isLast={index + 1 >= round.questions.length}
        question={question}
        wrongChoices={wrongChoices}
        wrongLetters={wrongLetters}
      />
    </div>
  );
}
