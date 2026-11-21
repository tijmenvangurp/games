import { useEffect, useMemo, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Check, Panel } from "@shared/ui";
import { cn } from "@shared/lib";
import { useTexts } from "@shared/i18n";
import { trayLabel, type TrayItem } from "@entities/gear";
import { trayShortLabel } from "../model/labels";
import { draaiwerkTexts } from "../model/texts";
import { trayOrder } from "../model/tray-order";
import { useDraaiwerkStore } from "../model/use-draaiwerk-store";
import { TrayArt } from "./gear-art";

function TrayPart({
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
  const t = useTexts(draaiwerkTexts);

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
      aria-label={`${label}${used ? t.usedSuffix : selected ? t.selectedSuffix : ""}`}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-16 min-w-0 cursor-grab touch-none flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition active:scale-[0.97] active:cursor-grabbing",
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
      <span className="relative grid h-14 place-items-center">
        {/* The part stands on the dot grid instead of in a card. */}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 h-1.5 w-11 rounded-full bg-foreground/10"
        />
        <span
          className={cn(
            "relative rounded-full p-1 transition group-hover:bg-muted/60",
            selected && "bg-primary/10 ring-2 ring-primary/35 group-hover:bg-primary/15",
            used && "opacity-35 grayscale",
          )}
        >
          <TrayArt item={item} />
        </span>
        {used ? (
          <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-success text-white">
            <Check aria-hidden="true" className="size-2.5" />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "relative text-[10px] font-bold leading-tight",
          selected ? "text-primary" : "text-foreground/70",
          used && "opacity-60",
        )}
      >
        {trayShortLabel(item)}
      </span>
    </button>
  );
}

export function DraaiwerkTray({ removing }: { removing: boolean }) {
  const level = useDraaiwerkStore((state) => state.level);
  const usedTrayIds = useDraaiwerkStore((state) => state.usedTrayIds);
  const selectedTrayId = useDraaiwerkStore((state) => state.selectedTrayId);
  const status = useDraaiwerkStore((state) => state.status);
  const solving = status === "solved";
  const t = useTexts(draaiwerkTexts);
  const items = useMemo(() => trayOrder(level), [level]);
  const { isOver, setNodeRef } = useDroppable({
    id: "tray-remove",
    disabled: !removing,
  });

  return (
    <Panel
      as="section"
      ref={(node) => setNodeRef(node)}
      aria-label={removing ? t.trayRemoving : t.tray}
      className={cn(
        "flex min-h-0 min-w-0 flex-col p-2.5 transition sm:p-3 md:h-full md:overflow-hidden md:portrait:h-auto md:landscape:col-span-2",
        removing && "border-dashed border-primary/60",
        isOver && "bg-primary-soft ring-2 ring-primary/20",
      )}
      data-drop-over={isOver ? "true" : "false"}
      data-tray-drop="true"
      padding="none"
    >
      <div className="mb-2 flex shrink-0 items-baseline justify-between gap-2">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {t.tray}
        </h2>
        {removing ? (
          <p className="text-[10px] font-bold text-primary">{t.releaseToRemove}</p>
        ) : (
          <p className="text-[10px] font-bold text-muted-foreground">
            {t.partsLeft(level.tray.length - usedTrayIds.length)}
          </p>
        )}
      </div>

      <div
        className={cn(
          "draaiwerk-tray-field game-scrollbar grid min-h-0 min-w-0 grid-cols-2 justify-items-center gap-1 overflow-y-auto rounded-lg p-1.5 md:landscape:flex-1 md:landscape:content-center",
          !removing && "content-start",
        )}
      >
        {items.length === 0 ? (
          <p className="col-span-2 py-4 text-sm text-muted-foreground">{t.noPartsLeft}</p>
        ) : null}

        {items.map((item) => (
          <TrayPart
            key={item.id}
            item={item}
            selected={selectedTrayId === item.id}
            solving={solving}
            used={usedTrayIds.includes(item.id)}
          />
        ))}
      </div>
    </Panel>
  );
}
