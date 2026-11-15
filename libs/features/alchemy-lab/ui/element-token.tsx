import type { AlchemyElement, ElementCategory } from "@entities/alchemy";
import { cn } from "@shared/lib";

const CATEGORY_STYLES: Record<ElementCategory, string> = {
  water: "border-sky-300 from-sky-200 via-cyan-100 to-blue-50",
  fire: "border-orange-300 from-orange-200 via-amber-100 to-rose-50",
  earth: "border-lime-300 from-lime-200 via-amber-100 to-yellow-50",
  air: "border-violet-300 from-violet-200 via-sky-100 to-white",
  life: "border-emerald-300 from-emerald-200 via-teal-100 to-lime-50",
  food: "border-pink-300 from-pink-200 via-rose-100 to-amber-50",
  tech: "border-slate-300 from-slate-200 via-zinc-100 to-white",
  fantasy: "border-fuchsia-300 from-fuchsia-200 via-violet-100 to-purple-50",
};

interface ElementTokenProps {
  element: AlchemyElement;
  variant?: "shelf" | "board" | "overlay";
  selected?: boolean;
  muted?: boolean;
  showLabel?: boolean;
  undiscovered?: boolean;
  className?: string;
}

export function ElementToken({
  element,
  variant = "shelf",
  selected = false,
  muted = false,
  showLabel = true,
  undiscovered = false,
  className,
}: ElementTokenProps) {
  const size = variant === "overlay" ? "size-24" : variant === "board" ? "size-20" : "size-16";

  return (
    <span className={cn("flex flex-col items-center gap-1", muted && "opacity-35", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "relative grid place-items-center rounded-full border-2 bg-gradient-to-br shadow-sm transition",
          size,
          CATEGORY_STYLES[element.category],
          selected && "scale-105 ring-4 ring-primary/40",
        )}
      >
        {undiscovered ? (
          <span className="text-2xl font-black text-slate-500">?</span>
        ) : (
          <>
            <img
              alt=""
              className="relative z-10 size-3/5 select-none"
              draggable={false}
              src={element.icon}
            />
            <span className="pointer-events-none absolute inset-1 rounded-full bg-gradient-to-br from-white/45 to-transparent" />
          </>
        )}
      </span>
      {showLabel && !undiscovered ? (
        <span className="max-w-20 text-center text-xs font-bold leading-tight">{element.name}</span>
      ) : null}
    </span>
  );
}
