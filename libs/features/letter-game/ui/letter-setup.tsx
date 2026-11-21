import {
  knownLetters,
  LETTER_LESSONS,
  LETTERS,
  type LetterLesson,
  type LetterProgressMap,
} from "@entities/letter";
import { BookOpen, Button, Ear, Eye, Panel, Play, TrainFront } from "@shared/ui";

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
  if (lesson === "zoemlees") {
    return <BookOpen aria-hidden="true" className="size-5" />;
  }
  return <TrainFront aria-hidden="true" className="size-5" />;
}

export function LetterSetup({ progress, onStart }: LetterSetupProps) {
  const known = knownLetters(progress);

  return (
    <Panel as="section" className="animate-rise mx-auto w-full max-w-xl" padding="lg">
      <h2 className="font-display text-2xl tracking-tight">Kies je les</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        10 letters · 6 vragen per les. Hoor de klank en kies de letter, lees woorden of bouw ze
        zelf.
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
            <span className="flex items-center gap-2 text-base font-bold">
              <LessonIcon lesson={lesson.id} />
              {lesson.title}
            </span>
            <span className="text-sm font-medium opacity-85">{lesson.description}</span>
          </Button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {LETTERS.map((letter) => (
          <span
            key={letter.id}
            className="flex min-h-12 items-center justify-center rounded-xl border border-border bg-background-subtle text-2xl font-black"
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

      <Panel className="mt-4 text-sm" padding="sm" surface="subtle">
        <p className="font-bold">Tip voor ouders</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          Laat je kind na de ronde een letter op papier schrijven of een gelezen woord aanwijzen in
          een boek. Dat helpt bij het onthouden.
        </p>
      </Panel>
    </Panel>
  );
}
