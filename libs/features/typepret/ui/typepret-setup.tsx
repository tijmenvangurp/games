import { isUnlocked, LESSONS, nextLessonId, type Progress } from "@entities/typepret";
import { Button, Check, Lock, Play, SetupPanel, StatusBanner } from "@shared/ui";
import { useNeedsKeyboard } from "../model/use-keyboard-hint";

interface TypepretSetupProps {
  progress: Progress;
  onStart: (lessonId: string) => void;
}

export function TypepretSetup({ progress, onStart }: TypepretSetupProps) {
  const needsKeyboard = useNeedsKeyboard();
  const next = nextLessonId(progress);

  return (
    <SetupPanel
      className="mx-auto w-full max-w-xl"
      subtitle={`${LESSONS.length} lessen · 20 toetsen per ronde. Zet je vingers op de basisrij en tik de letter die oplicht.`}
      title="Kies je les"
    >
      {needsKeyboard ? (
        <StatusBanner className="text-sm" role="status" tone="warning">
          Sluit een toetsenbord aan om te oefenen. Op een aanraakscherm kun je geen blind typen
          leren.
        </StatusBanner>
      ) : null}

      <div className="grid gap-2">
        {LESSONS.map((lesson) => {
          const unlocked = isUnlocked(lesson.id, progress);
          const done = progress.completed.includes(lesson.id);
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
                {lesson.title}
                {done ? <span className="text-sm font-semibold opacity-80">· afgerond</span> : null}
                {!unlocked ? (
                  <span className="text-sm font-semibold opacity-80">· nog dicht</span>
                ) : null}
              </span>
              <span className="text-sm font-medium opacity-85">{lesson.description}</span>
            </Button>
          );
        })}
      </div>
    </SetupPanel>
  );
}
