import { useState } from "react";
import { frenchAudioSrc, frenchExampleAudioSrc, type FrenchLesson } from "@entities/french";
import { Button, Panel, Volume2 } from "@shared/ui";
import { useFrenchProgressStore } from "../model/use-french-progress-store";
import { FrenchFlashcard } from "./french-flashcard";
import { FrenchFlashcardSummary } from "./french-flashcard-summary";
import { useFrenchAudio } from "./use-french-audio";
import { useTexts } from "@shared/i18n";
import { frenchTexts } from "./texts";

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
  const t = useTexts(frenchTexts);

  const item = items[index];

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setPractice(0);
    setFinished(false);
  };

  const mark = (didKnow: boolean) => {
    useFrenchProgressStore.getState().record(item.id, didKnow);
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
      <Panel className="flex items-center justify-between gap-3 px-4 py-3" padding="none">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t.cardsLabel}</p>
          <p className="text-sm font-bold tabular-nums">{t.card(index + 1, items.length)}</p>
        </div>
        <div className="text-right text-xs tabular-nums text-muted-foreground">
          <p>{t.knownCount(known)}</p>
          <p>{t.practiceCount(practice)}</p>
        </div>
      </Panel>

      <FrenchFlashcard flipped={flipped} item={item} onFlip={() => setFlipped((value) => !value)} />

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            play(frenchAudioSrc(item));
          }}
        >
          <Volume2 aria-hidden="true" className="size-5" />
          {item.kind === "word" ? t.cardWord : t.cardPhrase}
        </Button>
        {item.example ? (
          <Button
            variant="outline"
            onClick={() => {
              play(frenchExampleAudioSrc(item));
            }}
          >
            <Volume2 aria-hidden="true" className="size-5" />
            {t.cardExample}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" variant="outline" onClick={() => mark(false)}>
          {t.stillPractise}
        </Button>
        <Button size="lg" variant="success" onClick={() => mark(true)}>
          {t.iKnow}
        </Button>
      </div>
    </div>
  );
}
