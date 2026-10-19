import {
  provinceMap,
  worldMap,
  type Country,
  type FlagSubject,
  type WorldMap,
} from "@entities/geography";
import { useEffect, useState } from "react";

const MAP_WIDTH = 320;
const MAP_HEIGHT = 180;
// The Netherlands is almost square; a portrait frame shows it bigger.
const PROVINCE_MAP_WIDTH = 240;
const PROVINCE_MAP_HEIGHT = 260;

function isCountry(subject: FlagSubject): subject is Country {
  return "numeric" in subject;
}

/**
 * The maps are separate chunks, so nothing loads until the answer is shown.
 * Countries use the world atlas; provinces use the Dutch province map, where
 * a marker on a world map would put all twelve on the same dot.
 */
function usePlaceMap(subject: FlagSubject): WorldMap | null {
  const [map, setMap] = useState<WorldMap | null>(null);
  const { code, latitude, longitude } = subject;
  const numeric = isCountry(subject) ? subject.numeric : undefined;

  useEffect(() => {
    let cancelled = false;
    setMap(null);
    const load =
      numeric === undefined
        ? provinceMap(code, PROVINCE_MAP_WIDTH, PROVINCE_MAP_HEIGHT)
        : worldMap({ latitude, longitude, numeric }, MAP_WIDTH, MAP_HEIGHT);

    void load
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
  }, [code, latitude, longitude, numeric]);

  return map;
}

/**
 * Where the subject lies. Decorative (`aria-hidden`): the explanation already
 * tells the name and the region, and a screen reader reading out a map shape
 * adds nothing.
 */
export function PlaceMap({ subject }: { subject: FlagSubject }) {
  const map = usePlaceMap(subject);
  if (!map) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="mx-auto h-auto w-full max-w-xs rounded-2xl border bg-sky-50"
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
