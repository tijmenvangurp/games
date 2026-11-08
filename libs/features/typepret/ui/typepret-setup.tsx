import { isUnlocked, LESSONS, nextLessonId, type Progress } from "@entities/typepret";
import { Button, Check, Lock, Play } from "@shared/ui";
import { useNeedsKeyboard } from "../model/use-keyboard-hint";

interface TypepretSetupProps {
  progress: Progress;
  onStart: (lessonId: string) => void;
}

export function TypepretSetup({ progress, onStart }: TypepretSetupProps) {
  const needsKeyboard = useNeedsKeyboard();
  const next = nextLessonId(progress);

  return (
    <section className="game-panel mx-auto w-full max-w-xl p-4 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {LESSONS.length} lessen · 20 toetsen per ronde
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight">Kies je les</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Leer typen zonder te kijken. Zet je vingers op de basisrij en tik de letter die oplicht. Een
        fout is niet erg: je krijgt meteen een nieuwe kans.
      </p>

      {needsKeyboard ? (
        <p className="mt-3 rounded-2xl bg-muted p-3 text-sm font-semibold" role="status">
          Sluit een toetsenbord aan om te oefenen. Op een aanraakscherm kun je geen blind typen
          leren.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
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
              <span className="flex items-center gap-2 text-base font-black">
                {!unlocked ? (
                  <Lock aria-hidden="true" className="size-5" />
                ) : done ? (
                  <Check aria-hidden="true" className="size-5" />
                ) : (
                  <Play aria-hidden="true" className="size-5" />
                )}
                {lesson.title}
                {done ? <span className="text-sm font-bold opacity-80">· afgerond</span> : null}
                {!unlocked ? (
                  <span className="text-sm font-bold opacity-80">· nog dicht</span>
                ) : null}
              </span>
              <span className="text-sm font-semibold opacity-80">{lesson.description}</span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
