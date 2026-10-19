import { geoArea, geoBounds, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

/**
 * Degrees of longitude a map shows at least, so that small states and island
 * nations stay recognisable instead of filling the whole frame.
 */
const MIN_SPAN = 12;
const MAX_SPAN = 100;

export interface WorldMap {
  /** SVG path for all land, drawn as a backdrop. */
  land: string;
  /** SVG path for the subject itself; empty without an outline in the atlas. */
  highlight: string;
  /** Screen position of the subject's centre; always available. */
  marker: { x: number; y: number };
}

/** What a map needs to know about a place. */
export interface MapPlace {
  latitude: number;
  longitude: number;
  /** ISO 3166-1 numeric code of a country; provinces have none. */
  numeric?: string;
}

interface Atlas {
  countries: FeatureCollection;
  land: FeatureCollection;
}

let atlasPromise: Promise<Atlas> | undefined;

/**
 * Natural Earth 1:110m, bundled as a separate chunk so the app only loads it
 * when a map is shown. `?raw` keeps TypeScript from inferring a type for tens
 * of thousands of coordinates.
 */
function loadAtlas(): Promise<Atlas> {
  atlasPromise ??= import("./world-110m.json?raw").then((module) => {
    const topology = JSON.parse(module.default) as Topology;
    const countries = feature(topology, topology.objects.countries as GeometryCollection);
    const land = feature(topology, topology.objects.land as GeometryCollection);

    return { countries, land };
  });

  return atlasPromise;
}

/**
 * The largest polygon of a country. Countries like France and the Netherlands
 * have overseas parts; fitting the map to those would zoom out to the Atlantic,
 * so the mainland decides the zoom level.
 */
function largestPolygon(geometry: Geometry): Polygon | undefined {
  if (geometry.type === "Polygon") {
    return geometry;
  }
  if (geometry.type !== "MultiPolygon" || geometry.coordinates.length === 0) {
    return undefined;
  }

  const polygons: Polygon[] = geometry.coordinates.map((coordinates) => ({
    type: "Polygon",
    coordinates,
  }));

  return polygons.reduce((largest, polygon) =>
    geoArea(polygon) > geoArea(largest) ? polygon : largest,
  );
}

function spanFor(polygon: Polygon | undefined): number {
  if (!polygon) {
    return MIN_SPAN;
  }

  const [[west, south], [east, north]] = geoBounds(polygon);
  const span = Math.max(north - south, Math.abs(east - west));

  return Math.min(MAX_SPAN, Math.max(MIN_SPAN, span * 1.6));
}

function matchesNumeric(entry: Feature, numeric: string | undefined): boolean {
  return Boolean(numeric) && String(entry.id).padStart(3, "0") === numeric;
}

/**
 * Renders a place on a Mercator map of `width` by `height`: the surrounding
 * land as backdrop, the country highlighted (when the atlas has its outline)
 * and a marker on its centre. The zoom follows the country's size, so every
 * place gets a readable map.
 *
 * Pure rendering: no DOM, no network. Reusable for later map games (provinces,
 * rivers, capitals), which can pass their own geometry through the same
 * projection approach.
 */
export async function worldMap(place: MapPlace, width: number, height: number): Promise<WorldMap> {
  const atlas = await loadAtlas();
  const target = place.numeric
    ? atlas.countries.features.find((entry) => matchesNumeric(entry, place.numeric))
    : undefined;
  const polygon = target?.geometry ? largestPolygon(target.geometry) : undefined;
  const center: [number, number] = [place.longitude, place.latitude];
  const span = spanFor(polygon);

  // Mercator: a longitude span of `span` degrees is `span * π / 180` radians,
  // so this scale makes that span exactly as wide as the map.
  const projection = geoMercator()
    .center(center)
    .translate([width / 2, height / 2])
    .scale((width * 180) / (span * Math.PI))
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
  const path = geoPath(projection);
  const point = projection(center) ?? [width / 2, height / 2];

  return {
    land: path(atlas.land) ?? "",
    highlight: target?.geometry ? (path(target) ?? "") : "",
    marker: { x: point[0], y: point[1] },
  };
}
