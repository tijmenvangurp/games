import {
  worldMap,
  type Country,
  type FlagSubject,
  type MapPlace,
  type WorldMap,
} from "@entities/geography";
import { useEffect, useState } from "react";

const MAP_WIDTH = 320;
const MAP_HEIGHT = 180;

/**
 * The atlas is a separate chunk, so the map only loads once the answer is
 * shown. Until then, and if loading fails, the map stays out of the way: the
 * text explanation already carries the answer.
 */
function useWorldMap({ latitude, longitude, numeric }: MapPlace): WorldMap | null {
  const [map, setMap] = useState<WorldMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMap(null);
    void worldMap({ latitude, longitude, numeric }, MAP_WIDTH, MAP_HEIGHT)
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
  }, [latitude, longitude, numeric]);

  return map;
}

function isCountry(subject: FlagSubject): subject is Country {
  return "numeric" in subject;
}

function placeOf(subject: FlagSubject): MapPlace {
  return {
    latitude: subject.latitude,
    longitude: subject.longitude,
    numeric: isCountry(subject) ? subject.numeric : undefined,
  };
}

/**
 * Where the subject lies. Decorative (`aria-hidden`): the explanation already
 * tells the name and the region, and a screen reader reading out a map shape
 * adds nothing.
 */
export function PlaceMap({ subject }: { subject: FlagSubject }) {
  const map = useWorldMap(placeOf(subject));
  if (!map) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="mx-auto h-auto w-full max-w-xs rounded-2xl border bg-sky-50"
      data-testid="place-map"
      focusable="false"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
    >
      <path className="fill-emerald-50 stroke-emerald-200" d={map.land} strokeWidth={0.5} />
      {map.highlight ? (
        <path className="fill-rose-400 stroke-rose-600" d={map.highlight} strokeWidth={1} />
      ) : null}
      <circle className="fill-rose-600" cx={map.marker.x} cy={map.marker.y} r={3} />
    </svg>
  );
}
