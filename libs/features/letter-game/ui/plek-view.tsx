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
import {
  KLANK_POSITIONS,
  LETTER_BY_ID,
  type KlankPosition,
  type LetterId,
  type PlekQuestion,
} from "@entities/letter";
import { cn } from "@shared/lib";
import { useLetterStore } from "../model/use-letter-store";
import { LetterAudio } from "./letter-audio";
import type { TileState } from "./letter-tile";

function plekChoiceState(
  position: KlankPosition,
  target: KlankPosition,
  answered: boolean,
  wrongChoices: readonly string[],
): TileState {
  if (answered && position === target) {
    return "correct";
  }
  if (!answered && wrongChoices.includes(position)) {
    return "wrong";
  }
  if (answered) {
    return "muted";
  }
  return "default";
}

function LetterToken({ letter, disabled }: { letter: LetterId; disabled: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "plek-letter",
    disabled,
  });

  const play = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // The child can always use the Luister button.
    });
  };

  return (
    <>
      <audio ref={audioRef} preload="auto" src={LETTER_BY_ID[letter].sound} />
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Letter ${letter}`}
        className={cn(
          "flex size-16 touch-none items-center justify-center rounded-2xl border-2 border-primary bg-primary text-3xl font-black text-primary-foreground shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-40",
          isDragging && "opacity-30",
        )}
        disabled={disabled}
        type="button"
        onClick={play}
      >
        {letter}
      </button>
    </>
  );
}

function PlekBox({
  index,
  position,
  letter,
  state,
  revealed,
  disabled,
  onPlace,
}: {
  index: number;
  position: KlankPosition;
  letter: LetterId;
  state: TileState;
  revealed: boolean;
  disabled: boolean;
  onPlace: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: position, disabled });

  return (
    <button
      ref={setNodeRef}
      aria-label={`Vak ${index + 1}${revealed ? `: ${letter}` : ""}`}
      className={cn(
        "flex min-h-20 min-w-0 items-center justify-center rounded-2xl border-2 border-dashed text-3xl font-black transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-default disabled:active:scale-100",
        state === "default" && "border-border bg-muted/40",
        state === "correct" && "border-success bg-success/10 text-success",
        state === "wrong" && "border-danger bg-danger/10 text-danger",
        state === "muted" && "border-border bg-muted text-muted-foreground opacity-50",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/20",
      )}
      disabled={disabled}
      type="button"
      onClick={onPlace}
    >
      {revealed ? letter : null}
    </button>
  );
}

export function PlekView({
  question,
  answered,
  wrongChoices,
}: {
  question: PlekQuestion;
  answered: boolean;
  wrongChoices: readonly string[];
}) {
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const handleDragStart = (_event: DragStartEvent) => {
    setDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(false);
    const position = event.over?.id;
    if (position === "begin" || position === "midden" || position === "eind") {
      useLetterStore.getState().choose(position);
    }
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      sensors={sensors}
      onDragCancel={() => setDragging(false)}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <LetterAudio
        autoPlay
        label={`Luister naar ${question.word.word}`}
        src={question.word.audio}
      />
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Waar hoor je deze klank?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sleep de letter naar het juiste vakje, of tik op een vakje.
        </p>
      </div>

      <div className="mt-3 flex justify-center">
        <LetterToken disabled={answered} letter={question.target} />
      </div>

      <div aria-label="Kies het vak" className="mt-4 grid grid-cols-3 gap-2" role="group">
        {question.word.letters.map((letter, index) => {
          const position = KLANK_POSITIONS[index] ?? "begin";
          return (
            <PlekBox
              key={`${position}-${letter}`}
              disabled={answered || wrongChoices.includes(position)}
              index={index}
              letter={letter}
              position={position}
              revealed={answered}
              state={plekChoiceState(position, question.position, answered, wrongChoices)}
              onPlace={() => useLetterStore.getState().choose(position)}
            />
          );
        })}
      </div>

      <DragOverlay>
        {dragging ? (
          <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-primary bg-primary text-3xl font-black text-primary-foreground shadow-lg">
            {question.target}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
