import {
  knownLetters,
  LETTER_LESSONS,
  LETTERS,
  type LetterLesson,
  type LetterProgressMap,
} from "@entities/letter";
import { Button, Ear, Eye, Play, TrainFront } from "@shared/ui";

interface LetterSetupProps {
  progress: LetterProgressMap;
  onStart: (lesson: LetterLesson) => void;
}

function LessonIcon({ lesson }: { lesson: LetterLesson }) {
  if (lesson === "letters") {
    return <Play aria-hidden="true" className="size-5" />;
  }
  if (lesson === "woorden") {
    return <Eye aria-hidden="true" className="size-5" />;
  }
  if (lesson === "klankplek") {
    return <Ear aria-hidden="true" className="size-5" />;
  }
  return <TrainFront aria-hidden="true" className="size-5" />;
}

export function LetterSetup({ progress, onStart }: LetterSetupProps) {
  const known = knownLetters(progress);

  return (
    <section className="game-panel mx-auto w-full max-w-xl p-4 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        10 letters · 6 vragen per les
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight">Kies je les</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Hoor de klank en kies de letter, lees woorden of bouw ze zelf. Alle lessen gebruiken
        dezelfde letters.
      </p>

      <div className="mt-4 grid gap-2">
        {LETTER_LESSONS.map((lesson) => (
          <Button
            key={lesson.id}
            className="h-auto w-full flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left"
            size="lg"
            variant={lesson.id === "letters" ? "default" : "outline"}
            onClick={() => onStart(lesson.id)}
          >
            <span className="flex items-center gap-2 text-base font-black">
              <LessonIcon lesson={lesson.id} />
              {lesson.title}
            </span>
            <span className="text-sm font-semibold opacity-80">{lesson.description}</span>
          </Button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {LETTERS.map((letter) => (
          <span
            key={letter.id}
            className="flex min-h-12 items-center justify-center rounded-xl border bg-muted/50 text-2xl font-black"
          >
            {letter.glyph}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        {known.length > 0
          ? `Deze letters ken je al: ${known.join(", ")}.`
          : "We beginnen met i, k, m, s, p, v, e, n, t en a."}
      </p>

      <div className="mt-4 rounded-2xl bg-muted p-3 text-sm">
        <p className="font-bold">Tip voor ouders</p>
        <p className="mt-1 text-muted-foreground">
          Laat je kind na de ronde een letter op papier schrijven of een gelezen woord aanwijzen in
          een boek. Dat helpt bij het onthouden.
        </p>
      </div>
    </section>
  );
}
