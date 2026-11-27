import {
  knownLetters,
  LETTER_LESSONS,
  LETTERS,
  type LetterLesson,
  type LetterProgressMap,
} from "@entities/letter";
import { useTexts } from "@shared/i18n";
import { BookOpen, Button, Ear, Eye, Panel, Play, SetupPanel, TrainFront } from "@shared/ui";
import { letterTexts } from "./texts";

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
  const t = useTexts(letterTexts);

  return (
    <SetupPanel className="mx-auto w-full max-w-xl" subtitle={t.setupSubtitle} title={t.setupTitle}>
      {t.languageNote ? (
        <p className="text-sm font-semibold text-muted-foreground">{t.languageNote}</p>
      ) : null}
      <div className="grid gap-2">
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
              {t.lessons[lesson.id].title}
            </span>
            <span className="text-sm font-medium opacity-85">
              {t.lessons[lesson.id].description}
            </span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {LETTERS.map((letter) => (
          <span
            key={letter.id}
            className="flex min-h-12 items-center justify-center rounded-xl border border-border bg-background-subtle text-2xl font-black"
          >
            {letter.glyph}
          </span>
        ))}
      </div>

      <p className="text-sm font-semibold text-muted-foreground">
        {known.length > 0 ? t.known(known.join(", ")) : t.startLetters}
      </p>

      <Panel className="text-sm" padding="sm" surface="subtle">
        <p className="font-bold">{t.parentTipTitle}</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">{t.parentTip}</p>
      </Panel>
    </SetupPanel>
  );
}
