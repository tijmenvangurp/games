import { useState } from "react";
import { frenchAudioSrc, type FrenchLesson } from "@entities/french";
import { Button, Volume2 } from "@shared/ui";
import { FrenchFlashcard } from "./french-flashcard";
import { FrenchFlashcardSummary } from "./french-flashcard-summary";
import { useFrenchAudio } from "./use-french-audio";

interface FrenchFlashcardsProps {
  lesson: FrenchLesson;
}

export function FrenchFlashcards({ lesson }: FrenchFlashcardsProps) {
  const items = lesson.items.filter((item) => item.reviewed);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [practice, setPractice] = useState(0);
  const [finished, setFinished] = useState(false);
  const { play } = useFrenchAudio();

  const item = items[index];

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setPractice(0);
    setFinished(false);
  };

  const mark = (didKnow: boolean) => {
    if (didKnow) {
      setKnown((value) => value + 1);
    } else {
      setPractice((value) => value + 1);
    }
    setFlipped(false);
    if (index + 1 >= items.length) {
      setFinished(true);
    } else {
      setIndex((value) => value + 1);
    }
  };

  if (finished || !item) {
    return <FrenchFlashcardSummary known={known} practice={practice} onRestart={restart} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Oefen met kaarten
          </p>
          <p className="text-sm font-bold">
            Kaart {index + 1} van {items.length}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{known} gekend</p>
          <p>{practice} te oefenen</p>
        </div>
      </div>

      <FrenchFlashcard flipped={flipped} item={item} onFlip={() => setFlipped((value) => !value)} />

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => {
            play(frenchAudioSrc(item));
          }}
        >
          <Volume2 aria-hidden="true" className="size-5" />
          Beluister
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" variant="outline" onClick={() => mark(false)}>
          Nog oefenen
        </Button>
        <Button size="lg" variant="success" onClick={() => mark(true)}>
          Ken ik
        </Button>
      </div>
    </div>
  );
}
