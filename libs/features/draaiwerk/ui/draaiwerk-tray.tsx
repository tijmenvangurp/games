import { useEffect, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Check } from "@shared/ui";
import { cn } from "@shared/lib";
import { trayLabel, type TrayItem } from "@entities/gear";
import { trayShortLabel } from "../model/labels";
import { useDraaiwerkStore } from "../model/use-draaiwerk-store";
import { TrayArt } from "./gear-art";

function TrayCard({
  item,
  used,
  selected,
  solving,
}: {
  item: TrayItem;
  used: boolean;
  selected: boolean;
  solving: boolean;
}) {
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: `tray:${item.id}`,
    disabled: used || solving,
  });
  const wasDragging = useRef(false);
  const dndPointerDown = listeners?.onPointerDown;
  const label = trayLabel(item);

  useEffect(() => {
    if (isDragging) {
      wasDragging.current = true;
    }
  }, [isDragging]);

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${label}${used ? ", gebruikt" : selected ? ", gekozen" : ""}`}
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-16 min-w-28 shrink-0 cursor-grab touch-none flex-col items-stretch rounded-xl border p-1.5 text-left transition active:scale-[0.99] active:cursor-grabbing md:landscape:min-w-0 md:landscape:shrink",
        used
          ? "border-dashed border-border bg-muted/30 opacity-50"
          : "border-border bg-card hover:bg-muted/40",
        selected && "border-primary bg-primary/5 ring-2 ring-primary/25",
        isDragging && "opacity-30",
      )}
      data-selected={selected ? "true" : "false"}
      data-tray-id={item.id}
      data-used={used ? "true" : "false"}
      disabled={used || solving}
      type="button"
      onClick={() => {
        if (wasDragging.current) {
          wasDragging.current = false;
          return;
        }
        useDraaiwerkStore.getState().selectTray(item.id);
      }}
      onPointerDown={(event) => {
        wasDragging.current = false;
        dndPointerDown?.(event);
      }}
    >
      <span className="grid flex-1 place-items-center rounded-lg bg-muted/50 py-1">
        <TrayArt item={item} />
      </span>
      <span className="mt-1 block px-0.5 text-[10px] font-bold leading-tight">
        {trayShortLabel(item)}
      </span>
      {used ? (
        <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-success text-white">
          <Check aria-hidden="true" className="size-2.5" />
        </span>
      ) : null}
    </button>
  );
}

export function DraaiwerkTray({ removing }: { removing: boolean }) {
  const level = useDraaiwerkStore((state) => state.level);
  const usedTrayIds = useDraaiwerkStore((state) => state.usedTrayIds);
  const selectedTrayId = useDraaiwerkStore((state) => state.selectedTrayId);
  const status = useDraaiwerkStore((state) => state.status);
  const solving = status === "solved";
  const { isOver, setNodeRef } = useDroppable({
    id: "tray-remove",
    disabled: !removing,
  });

  return (
    <section
      ref={(node) => setNodeRef(node)}
      aria-label={removing ? "Onderdelen, sleep hier om weg te halen" : "Onderdelen"}
      className={cn(
        "game-panel flex min-h-0 min-w-0 flex-col p-2.5 transition sm:p-3 md:h-full md:overflow-hidden md:portrait:h-auto md:landscape:col-span-2",
        removing && "border-dashed border-primary/60",
        isOver && "bg-primary/5 ring-2 ring-primary/20",
      )}
      data-drop-over={isOver ? "true" : "false"}
      data-tray-drop="true"
    >
      <div className="mb-2 flex shrink-0 items-baseline justify-between gap-2">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Onderdelen
        </h2>
        {removing ? (
          <p className="text-[10px] font-bold text-primary">Loslaten om weg te halen</p>
        ) : (
          <p className="text-[10px] font-bold text-muted-foreground">
            {level.tray.length - usedTrayIds.length} over
          </p>
        )}
      </div>

      <div
        className={cn(
          "game-scrollbar grid min-h-0 min-w-0 gap-2 overflow-y-auto pb-1 md:landscape:flex-1",
          level.tray.length <= 2
            ? "grid-cols-1 md:landscape:content-center"
            : "grid-cols-2 content-start",
        )}
      >
        {level.tray.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Geen onderdelen meer.</p>
        ) : null}

        {level.tray.map((item) => (
          <TrayCard
            key={item.id}
            item={item}
            selected={selectedTrayId === item.id}
            solving={solving}
            used={usedTrayIds.includes(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
