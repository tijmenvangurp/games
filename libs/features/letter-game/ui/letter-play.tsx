import {
  LETTER_BY_ID,
  type JachtQuestion,
  type KlankQuestion,
  type LetterId,
  type LetterQuestion,
  type TreinQuestion,
  type VangerQuestion,
} from "@entities/letter";
import { Button } from "@shared/ui";
import { useLetterStore } from "../model/use-letter-store";
import { LetterAudio } from "./letter-audio";
import { LetterTile } from "./letter-tile";

type ChoiceState = "default" | "correct" | "wrong" | "muted";

function choiceState(
  letter: LetterId,
  target: LetterId,
  answered: boolean,
  wrongChoices: readonly LetterId[],
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
  wrongChoices: readonly LetterId[];
}) {
  return (
    <>
      <LetterAudio
        autoPlay
        label={`Luister naar de klank ${question.target}`}
        src={question.sound}
      />
      <div className="mt-3">
        <Prompt>Welke letter hoort bij deze klank?</Prompt>
      </div>
      <div aria-label="Kies de letter" className="mt-4 grid grid-cols-3 gap-2" role="group">
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
  wrongChoices: readonly LetterId[];
}) {
  return (
    <>
      <LetterAudio
        autoPlay
        label={`Luister naar ${question.word.word}`}
        src={question.word.audio}
      />
      <div className="mt-3">
        <Prompt>Welk woord hoor je? Welke letter hoort vooraan?</Prompt>
      </div>
      <div aria-label="Kies de eerste letter" className="mt-4 grid grid-cols-3 gap-2" role="group">
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
  wrongChoices: readonly LetterId[];
}) {
  return (
    <>
      <LetterAudio
        autoPlay
        label={`Luister naar de klank ${question.target}`}
        src={LETTER_BY_ID[question.target].sound}
      />
      <div className="mt-3 text-center">
        <Prompt>Zoek deze letter:</Prompt>
        <p className="mt-1 text-6xl font-black text-primary">{question.target}</p>
      </div>
      <div aria-label="Zoek de letter" className="mt-4 grid grid-cols-3 gap-2" role="group">
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

function TreinView({
  question,
  answered,
  filled,
  wrongLetters,
}: {
  question: TreinQuestion;
  answered: boolean;
  filled: readonly LetterId[];
  wrongLetters: readonly LetterId[];
}) {
  const expected = question.word.letters[filled.length];
  const hinted = wrongLetters.length >= 2 && expected !== undefined;

  return (
    <>
      <LetterAudio
        autoPlay
        label={`Luister naar ${question.word.word}`}
        src={question.word.audio}
      />
      <div className="mt-3">
        <Prompt>Bouw het woord. Welke letter komt erbij?</Prompt>
      </div>

      <div className="mt-4 flex justify-center gap-2" aria-label="Woordvakken">
        {question.word.letters.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            aria-label={`Vak ${index + 1}${filled[index] ? `: ${filled[index]}` : ""}`}
            className="flex size-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-3xl font-black"
          >
            {filled[index] ?? ""}
          </span>
        ))}
      </div>

      <div aria-label="Kies letters" className="mt-4 grid grid-cols-4 gap-2" role="group">
        {question.tiles.map((letter, index) => (
          <LetterTile
            key={`${letter}-${index}`}
            disabled={answered || filled.includes(letter)}
            letter={letter}
            state={
              filled.includes(letter)
                ? "muted"
                : hinted && letter === expected
                  ? "correct"
                  : "default"
            }
            onClick={() => useLetterStore.getState().submitTrain(letter)}
          />
        ))}
      </div>

      {hinted ? (
        <p className="mt-3 text-center text-sm font-bold text-success" aria-live="polite">
          De volgende letter is {expected}.
        </p>
      ) : null}
    </>
  );
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
  if (!answered) {
    if (question.kind === "trein" && wrongCount >= 2) {
      return null;
    }
    return (
      <p aria-live="polite" className="text-center text-sm font-semibold text-muted-foreground">
        {wrongCount > 0 ? "Bijna! Probeer nog eens." : "Luister en kies."}
      </p>
    );
  }

  const message = (() => {
    if (question.kind === "klank") {
      return correct
        ? `Ja! Dit is de ${question.target}. Luister nog eens.`
        : `Dit is de ${question.target}. Luister nog eens.`;
    }
    if (question.kind === "vanger") {
      return correct
        ? `Ja! ${question.word.word} begint met de ${question.target}.`
        : `Bijna. ${question.word.word} begint met de ${question.target}.`;
    }
    if (question.kind === "jacht") {
      return correct ? `Ja, dit is de ${question.target}.` : `Dit is de ${question.target}.`;
    }
    return correct ? `Goed gebouwd: ${question.word.word}.` : `Het woord is ${question.word.word}.`;
  })();

  const replaySrc =
    question.kind === "vanger" || question.kind === "trein"
      ? question.word.audio
      : LETTER_BY_ID[question.target].sound;

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
      <LetterAudio autoPlay={false} label="Luister nog eens" src={replaySrc} />
    </div>
  );
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
  wrongChoices: readonly LetterId[];
  filled: readonly LetterId[];
  wrongLetters: readonly LetterId[];
  isLast: boolean;
}) {
  return (
    <section className="game-panel p-4 sm:p-6">
      {question.kind === "klank" ? (
        <KlankView answered={answered} question={question} wrongChoices={wrongChoices} />
      ) : null}
      {question.kind === "vanger" ? (
        <VangerView answered={answered} question={question} wrongChoices={wrongChoices} />
      ) : null}
      {question.kind === "jacht" ? (
        <JachtView answered={answered} question={question} wrongChoices={wrongChoices} />
      ) : null}
      {question.kind === "trein" ? (
        <TreinView
          answered={answered}
          filled={filled}
          question={question}
          wrongLetters={wrongLetters}
        />
      ) : null}

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
          {isLast ? "Klaar" : "Volgende"}
        </Button>
      ) : null}
    </section>
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

  if (!round) {
    return null;
  }

  const question = round.questions[index];
  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <header className="game-panel flex items-center justify-between px-3 py-2">
        <p className="text-sm font-black text-muted-foreground">
          Vraag {index + 1} van {round.questions.length}
        </p>
        <span className="text-sm font-bold text-primary">Letterronde</span>
      </header>
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
