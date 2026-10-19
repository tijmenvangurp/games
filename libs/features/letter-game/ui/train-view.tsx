import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { LetterId, TreinQuestion } from "@entities/letter";
import { cn } from "@shared/lib";
import { useLetterStore } from "../model/use-letter-store";
import { LetterAudio } from "./letter-audio";
import type { TileState } from "./letter-tile";

function TrainLetter({
  letter,
  state,
  disabled,
  onTap,
}: {
  letter: LetterId;
  state: TileState;
  disabled: boolean;
  onTap: (letter: LetterId) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: letter,
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Letter ${letter}`}
      className={cn(
        "flex min-h-20 min-w-0 touch-none items-center justify-center rounded-2xl border-2 text-4xl font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none",
        state === "default" && "border-border bg-card hover:bg-muted",
        state === "correct" && "border-success bg-success/10 text-success",
        state === "wrong" && "border-danger bg-danger/10 text-danger",
        state === "muted" && "border-border bg-muted text-muted-foreground opacity-50",
        isDragging && "opacity-30",
      )}
      disabled={disabled}
      type="button"
      onClick={() => onTap(letter)}
    >
      {letter}
    </button>
  );
}

function TrainSlot({
  index,
  letter,
  active,
  disabled,
}: {
  index: number;
  letter: LetterId | undefined;
  active: boolean;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      aria-label={`Vak ${index + 1}${letter ? `: ${letter}` : ""}`}
      className={cn(
        "flex size-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-3xl font-black",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/20",
        active && "border-primary/60",
      )}
    >
      {letter ?? ""}
    </div>
  );
}

export function TrainView({
  question,
  answered,
  filled,
  wrongLetters,
}: {
  question: TreinQuestion;
  answered: boolean;
  filled: readonly LetterId[];
  wrongLetters: readonly LetterId[];
}) {
  const [active, setActive] = useState<LetterId | null>(null);
  const draggedRef = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  const expected = question.word.letters[filled.length];
  const expectedIndex = filled.length;
  const hinted = wrongLetters.length >= 2 && expected !== undefined;

  const submit = (letter: LetterId) => {
    if (draggedRef.current) {
      return;
    }
    useLetterStore.getState().submitTrain(letter);
  };

  const handleDragStart = (event: DragStartEvent) => {
    draggedRef.current = true;
    setActive(String(event.active.id) as LetterId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActive(null);
    if (event.over?.id !== `slot-${expectedIndex}`) {
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 250);
      return;
    }
    useLetterStore.getState().submitTrain(String(event.active.id) as LetterId);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 250);
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      sensors={sensors}
      onDragCancel={() => {
        setActive(null);
        draggedRef.current = false;
      }}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <LetterAudio
        autoPlay
        label={`Luister naar ${question.word.word}`}
        src={question.word.audio}
      />
      <div className="mt-3">
        <p className="text-center text-sm font-semibold text-muted-foreground">
          Bouw het woord. Sleep of tik de letters.
        </p>
      </div>

      <div aria-label="Woordvakken" className="mt-4 flex justify-center gap-2" role="group">
        {question.word.letters.map((letter, index) => (
          <TrainSlot
            key={`${letter}-${index}`}
            active={!answered && index === expectedIndex}
            disabled={answered || index !== expectedIndex}
            index={index}
            letter={filled[index]}
          />
        ))}
      </div>

      <div aria-label="Kies letters" className="mt-4 grid grid-cols-4 gap-2" role="group">
        {question.tiles.map((letter, index) => (
          <TrainLetter
            key={`${letter}-${index}`}
            disabled={answered || filled.includes(letter)}
            letter={letter}
            state={
              filled.includes(letter)
                ? "muted"
                : hinted && letter === expected
                  ? "correct"
                  : "default"
            }
            onTap={submit}
          />
        ))}
      </div>

      {hinted ? (
        <p className="mt-3 text-center text-sm font-bold text-success" aria-live="polite">
          De volgende letter is {expected}.
        </p>
      ) : null}

      <DragOverlay>
        {active ? (
          <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-primary bg-primary text-3xl font-black text-primary-foreground shadow-lg">
            {active}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
