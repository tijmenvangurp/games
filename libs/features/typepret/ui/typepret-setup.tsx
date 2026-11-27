import { isUnlocked, lessonText, LESSONS, nextLessonId, type Progress } from "@entities/typepret";
import { useLanguage, useTexts } from "@shared/i18n";
import { Button, Check, Lock, Play, SetupPanel, StatusBanner } from "@shared/ui";
import { useNeedsKeyboard } from "../model/use-keyboard-hint";
import { typepretTexts } from "./texts";

interface TypepretSetupProps {
  progress: Progress;
  onStart: (lessonId: string) => void;
}

export function TypepretSetup({ progress, onStart }: TypepretSetupProps) {
  const needsKeyboard = useNeedsKeyboard();
  const next = nextLessonId(progress);
  const language = useLanguage();
  const t = useTexts(typepretTexts);

  return (
    <SetupPanel
      className="mx-auto w-full max-w-xl"
      subtitle={t.setupSubtitle(LESSONS.length)}
      title={t.setupTitle}
    >
      {needsKeyboard ? (
        <StatusBanner className="text-sm" role="status" tone="warning">
          {t.setupKeyboard}
        </StatusBanner>
      ) : null}

      <div className="grid gap-2">
        {LESSONS.map((lesson) => {
          const unlocked = isUnlocked(lesson.id, progress);
          const done = progress.completed.includes(lesson.id);
          const text = lessonText(lesson, language);
          return (
            <Button
              key={lesson.id}
              className="h-auto min-h-11 w-full flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left"
              disabled={!unlocked}
              size="lg"
              variant={lesson.id === next ? "default" : "outline"}
              onClick={() => onStart(lesson.id)}
            >
              <span className="flex items-center gap-2 text-base font-bold">
                {!unlocked ? (
                  <Lock aria-hidden="true" className="size-5" />
                ) : done ? (
                  <Check aria-hidden="true" className="size-5" />
                ) : (
                  <Play aria-hidden="true" className="size-5" />
                )}
                {text.title}
                {done ? <span className="text-sm font-semibold opacity-80">{t.done}</span> : null}
                {!unlocked ? (
                  <span className="text-sm font-semibold opacity-80">{t.locked}</span>
                ) : null}
              </span>
              <span className="text-sm font-medium opacity-85">{text.description}</span>
            </Button>
          );
        })}
      </div>
    </SetupPanel>
  );
}
