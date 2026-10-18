import { useEffect } from "react";
import { frenchAudioSrc, frenchExampleAudioSrc } from "@entities/french";
import { playSound } from "@shared/lib";
import { useFrenchProgressStore } from "../model/use-french-progress-store";
import { useFrenchQuizStore } from "../model/use-french-quiz-store";
import { FrenchAudioPanel } from "./french-audio-panel";
import { FrenchFeedback } from "./french-feedback";
import { FrenchOption } from "./french-option";
import { FrenchQuizFinished } from "./french-quiz-finished";
import { FrenchQuizHeader } from "./french-quiz-header";
import { useFrenchAudio } from "./use-french-audio";

export function FrenchQuiz() {
  const question = useFrenchQuizStore((state) => state.question);
  const selected = useFrenchQuizStore((state) => state.selected);
  const answered = useFrenchQuizStore((state) => state.answered);
  const correctCount = useFrenchQuizStore((state) => state.correctCount);
  const index = useFrenchQuizStore((state) => state.index);
  const queue = useFrenchQuizStore((state) => state.queue);
  const finished = useFrenchQuizStore((state) => state.finished);
  const lesson = useFrenchQuizStore((state) => state.lesson);
  const pool = useFrenchQuizStore((state) => state.pool);
  const master = useFrenchQuizStore((state) => state.master);
  const { play } = useFrenchAudio();

  useEffect(() => {
    if (question) {
      play(frenchAudioSrc(question.item), master ? 1.15 : 1);
    }
  }, [question, master, play]);

  if (finished) {
    return (
      <FrenchQuizFinished
        correctCount={correctCount}
        total={queue.length}
        onRestart={() => {
          if (lesson) {
            useFrenchQuizStore.getState().start(lesson, pool, master);
          }
        }}
      />
    );
  }

  if (!question) {
    return null;
  }

  const correct = selected === question.item.nl;

  const handleAnswer = (option: string) => {
    const wasAnswered = useFrenchQuizStore.getState().answered;
    useFrenchQuizStore.getState().answer(option);
    const next = useFrenchQuizStore.getState();
    if (!wasAnswered && next.answered && next.question) {
      const correctAnswer = option === next.question.item.nl;
      useFrenchProgressStore.getState().record(next.question.item.id, correctAnswer);
      playSound(correctAnswer ? "match" : "wrong");
    }
  };

  const handleNext = () => {
    playSound("tap");
    useFrenchQuizStore.getState().next();
  };

  const replay = (rate: number) => {
    play(frenchAudioSrc(question.item), rate === 1 && master ? 1.15 : rate);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <FrenchQuizHeader
        correctCount={correctCount}
        index={index}
        master={master}
        total={queue.length}
      />
      <FrenchAudioPanel kind={question.item.kind} onReplay={replay} />

      <div aria-label="Kies de juiste vertaling" className="grid gap-2 sm:grid-cols-2" role="group">
        {question.options.map((option, optionIndex) => (
          <FrenchOption
            key={option}
            answered={answered}
            correct={question.item.nl}
            index={optionIndex}
            option={option}
            selected={selected}
            onSelect={handleAnswer}
          />
        ))}
      </div>

      {answered ? (
        <FrenchFeedback
          correct={correct}
          item={question.item}
          onNext={handleNext}
          onPlayExample={() => play(frenchExampleAudioSrc(question.item))}
        />
      ) : (
        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          Kies de Nederlandse vertaling.
        </p>
      )}
    </div>
  );
}
