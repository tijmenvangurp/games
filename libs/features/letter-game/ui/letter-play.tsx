import {
  KLANK_POSITION_PHRASES,
  LETTER_BY_ID,
  type JachtQuestion,
  type KlankQuestion,
  type LeesQuestion,
  type LetterId,
  type LetterLesson,
  type LetterQuestion,
  type LetterWord,
  type VangerQuestion,
} from "@entities/letter";
import { Button } from "@shared/ui";
import { useLetterStore } from "../model/use-letter-store";
import { LetterAudio } from "./letter-audio";
import { LetterTile } from "./letter-tile";
import { PlekView } from "./plek-view";
import { TrainView } from "./train-view";
import { WordTile } from "./word-tile";
import { ZoomView } from "./zoom-view";

type ChoiceState = "default" | "correct" | "wrong" | "muted";

function lessonHeader(lesson: LetterLesson): { unit: string; title: string } {
  if (lesson === "woorden") {
    return { unit: "Woord", title: "Woordlezen" };
  }
  if (lesson === "trein") {
    return { unit: "Woord", title: "Woordtrein" };
  }
  if (lesson === "klankplek") {
    return { unit: "Klank", title: "Klankplek" };
  }
  if (lesson === "zoemlees") {
    return { unit: "Woord", title: "Zoemlees" };
  }
  return { unit: "Vraag", title: "Letterronde" };
}

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
  wrongChoices: readonly string[];
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
  wrongChoices: readonly string[];
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

function LeesView({
  question,
  answered,
  wrongChoices,
}: {
  question: LeesQuestion;
  answered: boolean;
  wrongChoices: readonly string[];
}) {
  return (
    <>
      <LetterAudio
        autoPlay
        label={`Luister naar ${question.target.word}`}
        src={question.target.audio}
      />
      <div className="mt-3">
        <Prompt>Luister en lees. Welk woord hoor je?</Prompt>
      </div>
      <div aria-label="Kies het woord" className="mt-4 grid gap-2" role="group">
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

function successMessage(question: LetterQuestion): string {
  switch (question.kind) {
    case "klank":
      return `Ja! Dit is de ${question.target}. Luister nog eens.`;
    case "vanger":
      return `Ja! ${question.word.word} begint met de ${question.target}.`;
    case "jacht":
      return `Ja, dit is de ${question.target}.`;
    case "lees":
      return `Ja! Dit is ${question.target.word}.`;
    case "plek":
      return `Ja! De ${question.target} zit ${KLANK_POSITION_PHRASES[question.position]} ${question.word.word}.`;
    case "zoem":
      return `Ja! Je las ${question.word.word}.`;
    case "trein":
      return `Goed gebouwd: ${question.word.word}.`;
  }
}

function retryMessage(question: LetterQuestion): string {
  switch (question.kind) {
    case "klank":
      return `Dit is de ${question.target}. Luister nog eens.`;
    case "vanger":
      return `Bijna. ${question.word.word} begint met de ${question.target}.`;
    case "jacht":
      return `Dit is de ${question.target}.`;
    case "lees":
      return `Bijna. Dit woord is ${question.target.word}.`;
    case "plek":
      return `De ${question.target} zit ${KLANK_POSITION_PHRASES[question.position]} ${question.word.word}.`;
    case "zoem":
      return `Het woord is ${question.word.word}.`;
    case "trein":
      return `Het woord is ${question.word.word}.`;
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

  const message = correct ? successMessage(question) : retryMessage(question);

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
      <LetterAudio autoPlay={false} label="Luister nog eens" src={replaySrc} />
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
  return (
    <section className="game-panel p-4 sm:p-6">
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

  const header = lessonHeader(round.lesson);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <header className="game-panel flex items-center justify-between px-3 py-2">
        <p className="text-sm font-black text-muted-foreground">
          {header.unit} {index + 1} van {round.questions.length}
        </p>
        <span className="text-sm font-bold text-primary">{header.title}</span>
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
