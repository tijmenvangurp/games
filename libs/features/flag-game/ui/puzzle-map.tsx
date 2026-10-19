import type { RefObject } from "react";
import type { PuzzleMapArea } from "@entities/geography";
import { cn } from "@shared/lib";

const COUNTRY_CLASSES = {
  context: "fill-emerald-100 stroke-emerald-200",
  target: "fill-white stroke-primary/70",
  placed: "fill-emerald-400 stroke-emerald-700",
} as const;

function countryKind(isTarget: boolean, isPlaced: boolean): keyof typeof COUNTRY_CLASSES {
  if (!isTarget) {
    return "context";
  }

  return isPlaced ? "placed" : "target";
}

interface MapCountryProps {
  country: PuzzleMapArea;
  name: string | undefined;
  isTarget: boolean;
  isPlaced: boolean;
  isHighlighted: boolean;
  canPlace: boolean;
  onPlace: (code: string) => void;
}

function MapCountry({
  country,
  name,
  isTarget,
  isPlaced,
  isHighlighted,
  canPlace,
  onPlace,
}: MapCountryProps) {
  const interactive = isTarget && canPlace && !isPlaced;
  const dashed = isTarget && !isPlaced;

  const place = () => {
    if (interactive) {
      onPlace(country.code);
    }
  };

  return (
    <path
      aria-label={isTarget ? name : undefined}
      className={cn(
        "transition-colors",
        COUNTRY_CLASSES[countryKind(isTarget, isPlaced)],
        isHighlighted && "animate-pulse",
        interactive && "cursor-pointer",
      )}
      d={country.path}
      data-country={country.code}
      role={isTarget ? "button" : undefined}
      strokeDasharray={dashed ? "3 2" : undefined}
      strokeWidth={isTarget ? 1 : 0.4}
      tabIndex={interactive ? 0 : -1}
      onClick={place}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          place();
        }
      }}
    />
  );
}

interface PuzzleMapProps {
  areas: readonly PuzzleMapArea[];
  names: ReadonlyMap<string, string>;
  placed: ReadonlySet<string>;
  selected: string | null;
  level: "makkelijk" | "gemiddeld" | "moeilijk";
  total: number;
  width: number;
  height: number;
  svgRef: RefObject<SVGSVGElement | null>;
  onPlace: (code: string) => void;
}

/**
 * The board: every country with an outline, the empty slots of this round and
 * a hint dot on every slot when the level allows it.
 */
export function PuzzleMap({
  areas,
  names,
  placed,
  selected,
  level,
  total,
  width,
  height,
  svgRef,
  onPlace,
}: PuzzleMapProps) {
  const showHints = level !== "moeilijk";
  const pulse = level === "makkelijk";
  const openSlots = areas.filter((area) => names.has(area.code) && !placed.has(area.code));

  return (
    <svg
      aria-label={`Kaart met ${total} lege plekken`}
      className="w-full rounded-2xl bg-sky-50"
      data-testid="puzzle-map"
      ref={svgRef}
      role="group"
      viewBox={`0 0 ${width} ${height}`}
    >
      {areas.map((area) => (
        <MapCountry
          key={area.code}
          canPlace={Boolean(selected)}
          country={area}
          isHighlighted={pulse && selected === area.code}
          isPlaced={placed.has(area.code)}
          isTarget={names.has(area.code)}
          name={names.get(area.code)}
          onPlace={onPlace}
        />
      ))}

      {showHints
        ? openSlots.map((area) => (
            <circle
              key={`hint-${area.code}`}
              aria-hidden="true"
              className="pointer-events-none fill-primary"
              cx={area.x}
              cy={area.y}
              r={2.2}
            />
          ))
        : null}
    </svg>
  );
}
