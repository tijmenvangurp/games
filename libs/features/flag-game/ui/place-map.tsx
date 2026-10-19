import { regionMap, type FlagSubject, type WorldMap } from "@entities/geography";
import { useEffect, useState } from "react";

/** Countries use a landscape frame; the Netherlands is taller than it is wide. */
const LANDSCAPE = { width: 320, height: 220 };
const PORTRAIT = { width: 240, height: 260 };

/**
 * The maps are separate chunks, so nothing loads until the answer is shown.
 * The whole continent is drawn, not a close-up: that is where the child learns
 * where the country lies. Provinces use the map of the Netherlands.
 */
function useRegionMap(subject: FlagSubject): WorldMap | null {
  const [map, setMap] = useState<WorldMap | null>(null);
  const { code, region, latitude, longitude } = subject;
  const frame = region === "nederland" ? PORTRAIT : LANDSCAPE;

  useEffect(() => {
    let cancelled = false;
    setMap(null);
    void regionMap(subject, frame.width, frame.height)
      .then((next) => {
        if (!cancelled) {
          setMap(next);
        }
      })
      .catch(() => {
        // Decorative: without a map the question is still complete.
      });

    return () => {
      cancelled = true;
    };
    // The subject is fresh per question; its primitives are the real inputs.
  }, [code, region, latitude, longitude, frame.width, frame.height]);

  return map;
}

/**
 * Where the subject lies. Decorative (`aria-hidden`): the explanation already
 * tells the name and the region, and a screen reader reading out a map shape
 * adds nothing.
 */
export function PlaceMap({ subject }: { subject: FlagSubject }) {
  const map = useRegionMap(subject);
  if (!map) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="mx-auto h-auto w-full rounded-2xl border bg-sky-50"
      data-testid="place-map"
      focusable="false"
      viewBox={`0 0 ${map.width} ${map.height}`}
    >
      <path className="fill-emerald-50 stroke-emerald-200" d={map.land} strokeWidth={0.5} />
      {map.highlight ? (
        <path className="fill-rose-400 stroke-rose-600" d={map.highlight} strokeWidth={1} />
      ) : null}
      <circle className="fill-rose-600" cx={map.marker.x} cy={map.marker.y} r={3} />
    </svg>
  );
}
