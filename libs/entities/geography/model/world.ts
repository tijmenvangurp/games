import { geoArea, geoBounds, geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { subjectsFor } from "./config";
import { COUNTRIES } from "./countries";
import { PROVINCES } from "./provinces";
import type { FlagSubject } from "./types";

export interface WorldMap {
  /** SVG path for all land, drawn as a backdrop. */
  land: string;
  /** SVG path for the subject itself; empty without an outline in the atlas. */
  highlight: string;
  /** Screen position of the subject's centre; always available. */
  marker: { x: number; y: number };
  /** Size of the drawing area, so the SVG can use the right viewBox. */
  width: number;
  height: number;
}

/** Breathing room around the continent on the answer map. */
const REGION_MAP_PADDING = 14;

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
 * Renders the continent of a subject on a Mercator map of `width` by
 * `height`: every country of that continent as context, the subject
 * highlighted when the atlas has its outline, and a marker on its centre.
 * Showing the whole continent teaches where the country lies, instead of a
 * close-up of its neighbours. Without an outline (small states) the marker is
 * the only mark.
 *
 * Pure rendering: no DOM, no network.
 */
export async function regionMap(
  subject: FlagSubject,
  width: number,
  height: number,
): Promise<WorldMap> {
  if (subject.region === "nederland") {
    return provinceMap(subject.code, width, height);
  }

  const atlas = await loadAtlas();
  const shapes = countryShapes(byNumeric(atlas.countries.features));
  const entries = subjectsFor(subject.region);
  const features = [
    ...fitFeatures(shapes, entries),
    {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Point" as const,
        coordinates: [subject.longitude, subject.latitude],
      },
    },
  ];
  const projection = geoMercator()
    .fitExtent(
      [
        [REGION_MAP_PADDING, REGION_MAP_PADDING],
        [width - REGION_MAP_PADDING, height - REGION_MAP_PADDING],
      ],
      { type: "FeatureCollection", features },
    )
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
  const path = geoPath(projection);
  const target = shapes.get(subject.code);
  const marker = projection([subject.longitude, subject.latitude]) ?? [width / 2, height / 2];

  return {
    land: entries
      .flatMap((entry) => {
        const shape = shapes.get(entry.code);

        return shape ? [path(shape) ?? ""] : [];
      })
      .join(" "),
    highlight: target ? (path(target) ?? "") : "",
    marker: { x: marker[0], y: marker[1] },
    width,
    height,
  };
}

/** Piece box in SVG units; the tray scales it with CSS. */
const PIECE_SIZE = 84;

/** How far (in degrees) a polygon may lie from the mainland to join its piece. */
const PIECE_RADIUS = 30;

/** Breathing room around the selected shapes on the puzzle map. */
const MAP_PADDING = 22;

/** Breathing room around the Netherlands on the province map. */
const PROVINCE_MAP_PADDING = 10;

export interface PuzzleMapArea {
  code: string;
  path: string;
  /** Centre of the area in map coordinates, used as a drop hint. */
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
  /** Every shape that can be placed, drawn as the board. */
  areas: readonly PuzzleMapArea[];
  /** One normalized shape per selected area. */
  pieces: readonly PuzzlePiece[];
  /** Size of the drawing area, so the SVG can use the right viewBox. */
  width: number;
  height: number;
}

/** A drawable shape with the centre used for zooming and hints. */
interface MapEntry {
  code: string;
  latitude: number;
  longitude: number;
}

/** The ISO numeric codes that the world atlas has an outline for. */
export async function worldShapeCodes(): Promise<ReadonlySet<string>> {
  const atlas = await loadAtlas();

  return new Set(atlas.countries.features.map((entry) => String(entry.id).padStart(3, "0")));
}

/**
 * Country codes with a usable outline for the puzzle. Shapes on the
 * antimeridian (Russia, Fiji) are left out: a piece that is cut off at the
 * edge is not a fair puzzle.
 */
export async function countryShapeCodes(): Promise<ReadonlySet<string>> {
  const atlas = await loadAtlas();
  const numerics = new Set(
    atlas.countries.features.map((entry) => String(entry.id).padStart(3, "0")),
  );
  const crossing = new Set(
    atlas.countries.features
      .filter((entry) => entry.geometry && crossesAntimeridian(entry.geometry))
      .map((entry) => String(entry.id).padStart(3, "0")),
  );

  return new Set(
    COUNTRIES.filter(
      (country) => numerics.has(country.numeric) && !crossing.has(country.numeric),
    ).map((country) => country.code),
  );
}

let provinceFeaturesPromise: Promise<ReadonlyMap<string, Feature>> | undefined;

/** Natural Earth 1:10m province shapes, keyed by ISO 3166-2 code. */
function loadProvinceFeatures(): Promise<ReadonlyMap<string, Feature>> {
  provinceFeaturesPromise ??= import("./provinces-10m.json?raw").then((module) => {
    const collection = JSON.parse(module.default) as FeatureCollection;

    return new Map(
      collection.features.flatMap((entry) => {
        const code = (entry.properties as { code?: unknown } | null)?.code;

        return typeof code === "string" ? [[code, entry] as const] : [];
      }),
    );
  });

  return provinceFeaturesPromise;
}

/** Province codes with a shape, ready for the puzzle. */
export async function provinceShapeCodes(): Promise<ReadonlySet<string>> {
  return new Set((await loadProvinceFeatures()).keys());
}

function byNumeric(features: readonly Feature[]): ReadonlyMap<string, Feature> {
  return new Map(features.map((entry) => [String(entry.id).padStart(3, "0"), entry] as const));
}

function countryShapes(byCode: ReadonlyMap<string, Feature>): ReadonlyMap<string, Feature> {
  return new Map(
    COUNTRIES.flatMap((country) => {
      const shape = byCode.get(country.numeric);

      return shape ? [[country.code, shape] as const] : [];
    }),
  );
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
 * The polygons that belong to the shape itself, without far-away overseas
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

function polygonsAsGeometry(polygons: readonly Polygon[]): Geometry {
  return polygons.length === 1
    ? (polygons[0] as Geometry)
    : { type: "MultiPolygon", coordinates: polygons.map((polygon) => polygon.coordinates) };
}

/** True when the country's own shape spans the antimeridian (Russia, Fiji). */
function crossesAntimeridian(geometry: Geometry): boolean {
  const polygons = piecePolygons(geometry);
  if (polygons.length === 0) {
    return false;
  }
  const [[west], [east]] = geoBounds(polygonsAsGeometry(polygons));

  return west > east;
}

/**
 * The shapes the map should fit on. Land shapes are used as they are; a shape
 * that crosses the antimeridian (Russia, Fiji) is left out, because it would
 * stretch the fit to the whole world. The answer map still adds the subject
 * itself, so a Russian answer stays visible.
 */
function fitFeatures(
  shapes: ReadonlyMap<string, Feature>,
  selected: readonly MapEntry[],
): Feature[] {
  return selected.flatMap((entry) => {
    const shape = shapes.get(entry.code);
    if (!shape?.geometry) {
      return [];
    }
    const polygons = piecePolygons(shape.geometry);
    if (polygons.length === 0) {
      return [];
    }
    const geometry = polygonsAsGeometry(polygons);
    if (crossesAntimeridian(geometry)) {
      return [];
    }

    return [{ type: "Feature" as const, properties: {}, geometry }];
  });
}

function buildPuzzleMap(
  shapes: ReadonlyMap<string, Feature>,
  entries: readonly MapEntry[],
  selected: readonly MapEntry[],
  width: number,
  height: number,
): PuzzleMap {
  const features = fitFeatures(shapes, selected);
  const fit =
    features.length > 0
      ? { type: "FeatureCollection" as const, features }
      : {
          type: "MultiPoint" as const,
          coordinates: selected.map(
            (entry) => [entry.longitude, entry.latitude] as [number, number],
          ),
        };
  const projection = geoMercator()
    .fitExtent(
      [
        [MAP_PADDING, MAP_PADDING],
        [width - MAP_PADDING, height - MAP_PADDING],
      ],
      fit,
    )
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
  const path = geoPath(projection);

  const areas = entries.flatMap((entry) => {
    const shape = shapes.get(entry.code);
    const center = shape ? projection([entry.longitude, entry.latitude]) : undefined;

    return shape && center
      ? [{ code: entry.code, path: path(shape) ?? "", x: center[0], y: center[1] }]
      : [];
  });

  const pieces = selected.flatMap((entry) => {
    const shape = shapes.get(entry.code);
    const piece = shape?.geometry ? pieceFor(entry.code, shape.geometry) : undefined;

    return piece ? [piece] : [];
  });

  return { areas, pieces, width, height };
}

/**
 * Builds the country puzzle board: every country with an outline as context,
 * and a normalized piece for each selected country. The view is fitted to the
 * selected countries' centres, so this round's pieces are always in frame.
 */
export async function puzzleMap(
  selected: readonly FlagSubject[],
  width: number,
  height: number,
): Promise<PuzzleMap> {
  const atlas = await loadAtlas();

  return buildPuzzleMap(
    countryShapes(byNumeric(atlas.countries.features)),
    COUNTRIES,
    selected,
    width,
    height,
  );
}

/** The same puzzle board, drawn from the twelve province shapes. */
export async function provincePuzzleMap(
  selected: readonly FlagSubject[],
  width: number,
  height: number,
): Promise<PuzzleMap> {
  return buildPuzzleMap(await loadProvinceFeatures(), PROVINCES, selected, width, height);
}

/**
 * Draws the Netherlands with one province highlighted. Used in the flag quiz
 * when the subject is a province: the world map would put every province on
 * the same dot.
 */
export async function provinceMap(code: string, width: number, height: number): Promise<WorldMap> {
  const features = await loadProvinceFeatures();
  const shapes = [...features.values()];
  const projection = geoMercator()
    .fitExtent(
      [
        [PROVINCE_MAP_PADDING, PROVINCE_MAP_PADDING],
        [width - PROVINCE_MAP_PADDING, height - PROVINCE_MAP_PADDING],
      ],
      { type: "FeatureCollection", features: shapes },
    )
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
  const path = geoPath(projection);
  const target = features.get(code);
  const center = target ? geoCentroid(target) : ([5.3, 52.2] as [number, number]);
  const marker = projection(center) ?? [width / 2, height / 2];

  return {
    land: shapes.map((shape) => path(shape) ?? "").join(" "),
    highlight: target ? (path(target) ?? "") : "",
    marker: { x: marker[0], y: marker[1] },
    width,
    height,
  };
}
