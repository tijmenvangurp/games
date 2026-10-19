import type { RefObject } from "react";
import type { PuzzleMapCountry } from "@entities/geography";
import { cn } from "@shared/lib";
import { PUZZLE_MAP_HEIGHT, PUZZLE_MAP_WIDTH } from "../model/use-flags-store";

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
  country: PuzzleMapCountry;
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
  countries: readonly PuzzleMapCountry[];
  names: ReadonlyMap<string, string>;
  placed: ReadonlySet<string>;
  selected: string | null;
  level: "makkelijk" | "gemiddeld" | "moeilijk";
  total: number;
  svgRef: RefObject<SVGSVGElement | null>;
  onPlace: (code: string) => void;
}

/**
 * The board: every country with an outline, the empty slots of this round and
 * a hint dot on every slot when the level allows it.
 */
export function PuzzleMap({
  countries,
  names,
  placed,
  selected,
  level,
  total,
  svgRef,
  onPlace,
}: PuzzleMapProps) {
  const showHints = level !== "moeilijk";
  const pulse = level === "makkelijk";
  const openSlots = countries.filter(
    (country) => names.has(country.code) && !placed.has(country.code),
  );

  return (
    <svg
      aria-label={`Kaart met ${total} lege plekken`}
      className="w-full rounded-2xl bg-sky-50"
      data-testid="puzzle-map"
      ref={svgRef}
      role="group"
      viewBox={`0 0 ${PUZZLE_MAP_WIDTH} ${PUZZLE_MAP_HEIGHT}`}
    >
      {countries.map((country) => (
        <MapCountry
          key={country.code}
          canPlace={Boolean(selected)}
          country={country}
          isHighlighted={pulse && selected === country.code}
          isPlaced={placed.has(country.code)}
          isTarget={names.has(country.code)}
          name={names.get(country.code)}
          onPlace={onPlace}
        />
      ))}

      {showHints
        ? openSlots.map((country) => (
            <circle
              key={`hint-${country.code}`}
              aria-hidden="true"
              className="pointer-events-none fill-primary"
              cx={country.x}
              cy={country.y}
              r={2.2}
            />
          ))
        : null}
    </svg>
  );
}
