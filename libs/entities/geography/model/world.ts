import { geoArea, geoBounds, geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { COUNTRIES } from "./countries";
import type { Country } from "./types";

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

/** Piece box in SVG units; the tray scales it with CSS. */
const PIECE_SIZE = 84;

/** How far (in degrees) a polygon may lie from the mainland to join its piece. */
const PIECE_RADIUS = 30;

/** Breathing room around the selected countries on the puzzle map. */
const MAP_PADDING = 22;

export interface PuzzleMapCountry {
  code: string;
  path: string;
  /** Centre of the country in map coordinates, used as a drop hint. */
  x: number;
  y: number;
}

export interface PuzzlePiece {
  code: string;
  path: string;
  width: number;
  height: number;
}

export interface PuzzleMap {
  /** Every country with an outline, drawn as the board. */
  countries: readonly PuzzleMapCountry[];
  /** One normalized shape per selected country. */
  pieces: readonly PuzzlePiece[];
}

/** The ISO numeric codes that the world atlas has an outline for. */
export async function worldShapeCodes(): Promise<ReadonlySet<string>> {
  const atlas = await loadAtlas();

  return new Set(atlas.countries.features.map((entry) => String(entry.id).padStart(3, "0")));
}

function featuresByNumeric(features: readonly Feature[]): ReadonlyMap<string, Feature> {
  return new Map(features.map((entry) => [String(entry.id).padStart(3, "0"), entry] as const));
}

/** Distance in degrees, also correct across the antimeridian. */
function wrappedDistance(left: number, right: number): number {
  const difference = Math.abs(left - right);

  return Math.min(difference, 360 - difference);
}

function toPolygons(geometry: Geometry): Polygon[] {
  if (geometry.type === "Polygon") {
    return [geometry];
  }

  const coordinates = geometry.type === "MultiPolygon" ? geometry.coordinates : [];

  return coordinates.map((rings) => ({ type: "Polygon", coordinates: rings }));
}

function largestOf(polygons: readonly Polygon[]): Polygon {
  return polygons.reduce((largest, polygon) =>
    geoArea(polygon) > geoArea(largest) ? polygon : largest,
  );
}

function withinPiece(polygon: Polygon, centerLon: number, centerLat: number): boolean {
  const [lon, lat] = geoCentroid(polygon);

  return (
    wrappedDistance(lon, centerLon) <= PIECE_RADIUS && Math.abs(lat - centerLat) <= PIECE_RADIUS
  );
}

/**
 * The polygons that belong to the country itself, without far-away overseas
 * parts: everything within `PIECE_RADIUS` degrees of the largest polygon.
 * Archipelagos keep their islands; French Guiana does not join France.
 */
function piecePolygons(geometry: Geometry): Polygon[] {
  const polygons = toPolygons(geometry);
  if (polygons.length === 0) {
    return [];
  }

  const [centerLon, centerLat] = geoCentroid(largestOf(polygons));

  return polygons.filter((polygon) => withinPiece(polygon, centerLon, centerLat));
}

function pieceFor(code: string, geometry: Geometry): PuzzlePiece | undefined {
  const polygons = piecePolygons(geometry);
  if (polygons.length === 0) {
    return undefined;
  }

  const shape: FeatureCollection = {
    type: "FeatureCollection",
    features: polygons.map((polygon) => ({
      type: "Feature",
      properties: {},
      geometry: polygon,
    })),
  };
  const projection = geoMercator().fitExtent(
    [
      [3, 3],
      [PIECE_SIZE - 3, PIECE_SIZE - 3],
    ],
    shape,
  );

  return {
    code,
    path: geoPath(projection)(shape) ?? "",
    width: PIECE_SIZE,
    height: PIECE_SIZE,
  };
}

function mapCountry(
  country: Country,
  features: ReadonlyMap<string, Feature>,
  path: ReturnType<typeof geoPath>,
  projection: ReturnType<typeof geoMercator>,
): PuzzleMapCountry | undefined {
  const outline = features.get(country.numeric);
  const center = projection([country.longitude, country.latitude]);
  if (!outline || !center) {
    return undefined;
  }

  return { code: country.code, path: path(outline) ?? "", x: center[0], y: center[1] };
}

function mapPiece(
  country: Country,
  features: ReadonlyMap<string, Feature>,
): PuzzlePiece | undefined {
  const outline = features.get(country.numeric);

  return outline?.geometry ? pieceFor(country.code, outline.geometry) : undefined;
}

/**
 * Builds the puzzle board: every country with an outline as context, and a
 * normalized piece for each selected country. The view is fitted to the
 * selected countries' centres, so this round's pieces are always in frame.
 */
export async function puzzleMap(
  selected: readonly Country[],
  width: number,
  height: number,
): Promise<PuzzleMap> {
  const atlas = await loadAtlas();
  const features = featuresByNumeric(atlas.countries.features);
  const centers = selected.map(
    (country) => [country.longitude, country.latitude] as [number, number],
  );
  const projection = geoMercator()
    .fitExtent(
      [
        [MAP_PADDING, MAP_PADDING],
        [width - MAP_PADDING, height - MAP_PADDING],
      ],
      { type: "MultiPoint", coordinates: centers },
    )
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
  const path = geoPath(projection);

  const countries = COUNTRIES.flatMap((country) => {
    const mapped = mapCountry(country, features, path, projection);

    return mapped ? [mapped] : [];
  });
  const pieces = selected.flatMap((country) => {
    const piece = mapPiece(country, features);

    return piece ? [piece] : [];
  });

  return { countries, pieces };
}
