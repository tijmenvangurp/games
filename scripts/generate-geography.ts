import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

/**
 * Generates the geography data, the local flag assets and the world atlas that
 * together form the foundation of the app.
 *
 * Sources (see docs/adr/0015-vlaggenspel.md and docs/adr/0016-wereldkaart.md):
 * - flag-icons (MIT) for the country flags and the continent of every country;
 * - Wikimedia Commons (public domain) for the twelve Dutch province flags;
 * - Wikidata (CC0) for the Dutch names, capitals, ISO codes and coordinates,
 *   and for the selection of sovereign states and provinces;
 * - Natural Earth 1:110m via world-atlas (ISC) for the country outlines.
 *
 * Run `pnpm run geography` to regenerate, `pnpm run geography:check` to verify
 * the committed data and assets without touching the network. Generated files
 * are committed so the app itself never fetches anything at runtime. Run
 * `pnpm run format` afterwards: the data files are written in the formatter's
 * layout.
 */

const FLAG_ICONS_VERSION = "7.6.0";
const FLAG_ICONS_CDN = `https://cdn.jsdelivr.net/npm/flag-icons@${FLAG_ICONS_VERSION}`;
const WORLD_ATLAS_VERSION = "2.0.2";
const WORLD_ATLAS_URL = `https://cdn.jsdelivr.net/npm/world-atlas@${WORLD_ATLAS_VERSION}/countries-110m.json`;
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const DATA_FILE = "libs/entities/geography/model/countries.ts";
const PROVINCE_DATA_FILE = "libs/entities/geography/model/provinces.ts";
const ATLAS_FILE = "libs/entities/geography/model/world-110m.json";
const ASSET_DIR = "apps/games/public/flags";

/** Wikidata class of the Dutch provinces. */
const PROVINCE_CLASS = "Q134390";

/** Outlines that must be present in the atlas, as a sanity check. */
const REQUIRED_ATLAS_IDS = ["076", "250", "528", "710", "840"];
const MIN_ATLAS_COUNTRIES = 170;

/** Licences we accept for a province flag. */
const ACCEPTED_LICENCES = ["public domain", "cc0"];

/**
 * What a browser would fetch from a flag: `href`/`src` attributes and `url()`
 * references. Internal references (`#id`) and data URIs are fine; XML namespace
 * declarations (`xmlns:...="http://..."`) are not requests and are ignored.
 */
const EXTERNAL_REFERENCE =
  /\b(?:href|src)\s*=\s*["'](?!#|data:)[^"']*["']|\burl\(\s*["']?(?!#|data:)[^)"']+/i;

const CONTINENT_SLUGS = {
  Europe: "europa",
  Asia: "azie",
  Africa: "afrika",
  "North America": "noord-amerika",
  "South America": "zuid-amerika",
  Oceania: "oceanie",
} as const;

type Slug = (typeof CONTINENT_SLUGS)[keyof typeof CONTINENT_SLUGS];

const CONTINENT_ORDER: readonly Slug[] = [
  "europa",
  "azie",
  "afrika",
  "noord-amerika",
  "zuid-amerika",
  "oceanie",
];

/**
 * Dutch labels from Wikidata occasionally carry the official long name or an
 * older spelling. These are the deliberate corrections.
 */
const NAME_OVERRIDES: Readonly<Record<string, string>> = {
  CN: "China",
  NL: "Nederland",
  NR: "Nauru",
  PS: "Palestina",
  ST: "São Tomé en Principe",
  SZ: "Eswatini",
};

/** Territories that Wikidata counts as a state but that are not a country. */
const EXCLUDED_CODES = new Set(["GI"]);

/** Countries whose continent is a judgement call rather than a fact. */
const CONTINENT_OVERRIDES: Readonly<Record<string, Slug>> = {
  TT: "noord-amerika",
};

const USER_AGENT =
  "spellen-geography/1.0 (https://github.com/tijmenvangurp/games; educational kids app)";

interface Country {
  code: string;
  name: string;
  region: Slug;
  capital: string;
  /** ISO 3166-1 numeric code, zero padded to three digits; "" when unknown. */
  numeric: string;
  latitude: number;
  longitude: number;
}

interface Province {
  /** Lowercase ISO 3166-2 code, for example "nl-dr". */
  code: string;
  name: string;
  capital: string;
  latitude: number;
  longitude: number;
}

/** A province plus the Commons file its flag comes from, for downloading. */
interface ProvinceSource extends Province {
  flagFile: string;
}

/** The Wikidata facts we need per subject, besides the Dutch name. */
interface SubjectFacts {
  latitude: number;
  longitude: number;
  capital: string;
}

interface CountryFacts extends SubjectFacts {
  numeric: string;
}

interface ProvinceFacts extends SubjectFacts {
  /** Commons file name of the flag, as Wikidata P41 links to it. */
  flagFile: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

async function fetchJson(url: string, headers?: Record<string, string>): Promise<unknown> {
  const response = await fetchWithRetry(url, headers);
  return response.json();
}

async function fetchText(url: string, headers?: Record<string, string>): Promise<string> {
  const response = await fetchWithRetry(url, headers);
  return response.text();
}

/** Wikimedia rate limits the asset hosts, so a generating run retries those. */
function isRetryable(status: number): boolean {
  return status === 429 || status === 503;
}

async function fetchWithRetry(
  url: string,
  headers?: Record<string, string>,
  attempts = 3,
): Promise<Response> {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, headers ? { headers } : undefined);
    if (response.ok) {
      return response;
    }
    lastStatus = response.status;
    if (!isRetryable(lastStatus)) {
      break;
    }
    await sleep(2000 * attempt);
  }

  throw new Error(`${url} gaf HTTP ${lastStatus}`);
}

interface FlagIconsCountry {
  code: string;
  name: string;
  continent: string;
}

function isStrings(values: readonly (string | undefined)[]): values is string[] {
  return values.every((value): value is string => typeof value === "string");
}

function toFlagIconsCountry(value: unknown): FlagIconsCountry | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const triple = [
    readString(value, "code"),
    readString(value, "name"),
    readString(value, "continent"),
  ];
  if (!isStrings(triple)) {
    return undefined;
  }
  const [code, name, continent] = triple;
  return { code: code.toUpperCase(), name, continent };
}

async function fetchFlagIconsCountries(): Promise<Map<string, FlagIconsCountry>> {
  const payload = await fetchJson(`${FLAG_ICONS_CDN}/country.json`);
  if (!isRecord(payload)) {
    throw new Error("flag-icons country.json heeft een onverwachte vorm");
  }

  const countries = new Map<string, FlagIconsCountry>();
  for (const value of Object.values(payload)) {
    const country = toFlagIconsCountry(value);
    if (country) {
      countries.set(country.code, country);
    }
  }
  return countries;
}

function bindingValue(value: unknown): string | undefined {
  return isRecord(value) ? readString(value, "value") : undefined;
}

function bindingsOf(payload: unknown): unknown[] {
  const results = isRecord(payload) ? payload.results : undefined;
  const bindings = isRecord(results) ? results.bindings : undefined;
  if (!Array.isArray(bindings)) {
    throw new Error("Wikidata gaf een onverwachte vorm");
  }
  return bindings;
}

async function askWikidata(query: string): Promise<unknown[]> {
  const payload = await fetchJson(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`,
    { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  );
  return bindingsOf(payload);
}

/** `Point(5.55 52.32)`, as Wikidata returns P625. */
const POINT_PATTERN = /^Point\((?<longitude>[-\d.]+) (?<latitude>[-\d.]+)\)$/;

interface Coordinates {
  longitude: number;
  latitude: number;
}

function parseCoordinate(value: string | undefined): Coordinates | undefined {
  const groups = value ? POINT_PATTERN.exec(value)?.groups : undefined;
  const longitude = Number(groups?.longitude);
  const latitude = Number(groups?.latitude);

  return Number.isFinite(longitude) && Number.isFinite(latitude)
    ? { longitude, latitude }
    : undefined;
}

function parseNumeric(value: string | undefined): string {
  return value ? value.padStart(3, "0") : "";
}

function parseCapitals(nl: string | undefined, en: string | undefined): string {
  const parts = (nl || en || "").split("|").filter(Boolean);
  return [...new Set(parts)].sort((left, right) => left.localeCompare(right, "nl")).join(", ");
}

function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function factsFromBinding(
  binding: Record<string, unknown>,
  name: string,
): SubjectFacts | undefined {
  const coordinate = parseCoordinate(bindingValue(binding.coordinate));
  if (!coordinate) {
    console.warn(`Wikidata mist coördinaten voor ${name}; overgeslagen`);
    return undefined;
  }
  return {
    latitude: roundCoordinate(coordinate.latitude),
    longitude: roundCoordinate(coordinate.longitude),
    capital: parseCapitals(bindingValue(binding.capitalsNl), bindingValue(binding.capitalsEn)),
  };
}

const CAPITAL_COLUMNS = `(GROUP_CONCAT(DISTINCT ?capitalNl; separator="|") AS ?capitalsNl) (GROUP_CONCAT(DISTINCT ?capitalEn; separator="|") AS ?capitalsEn)`;

const CAPITAL_PATTERNS = `OPTIONAL { ?subject wdt:P36 ?capital . }
  OPTIONAL {
    ?capital rdfs:label ?capitalNl .
    FILTER(lang(?capitalNl) = "nl")
  }
  OPTIONAL {
    ?capital rdfs:label ?capitalEn .
    FILTER(lang(?capitalEn) = "en")
  }`;

/**
 * One row of the country or province query: the subject's code and Dutch name,
 * its shared facts, and the two extras only one of the two kinds needs.
 */
interface ParsedSubject {
  iso: string;
  label: string;
  facts: SubjectFacts;
  /** Empty for provinces: ISO 3166-2 has no numeric code. */
  numeric: string;
  /** Only present for provinces, which point at a Commons file. */
  flagFile: string | undefined;
}

function parseSubjectBinding(binding: unknown): ParsedSubject | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }
  const iso = bindingValue(binding.iso)?.toUpperCase();
  const label = bindingValue(binding.label);
  const facts = iso && label ? factsFromBinding(binding, iso) : undefined;
  if (!iso || !label || !facts) {
    return undefined;
  }

  return {
    iso,
    label,
    facts,
    numeric: parseNumeric(bindingValue(binding.numeric)),
    flagFile: commonsFileName(bindingValue(binding.flag)),
  };
}

/**
 * Sovereign states (Wikidata P31/P279* Q3624078) that carry an ISO 3166-1
 * alpha-2 code, with their Dutch label and the facts the map and the
 * explanation need: ISO numeric code, capital and coordinates.
 */
async function fetchSovereignStates(): Promise<Map<string, CountryFacts & { label: string }>> {
  const query = `SELECT ?iso (SAMPLE(?label) AS ?label) (SAMPLE(?numeric) AS ?numeric) (SAMPLE(?coordinate) AS ?coordinate) ${CAPITAL_COLUMNS} WHERE {
  ?subject wdt:P31/wdt:P279* wd:Q3624078 ;
           wdt:P297 ?iso ;
           rdfs:label ?label .
  FILTER(lang(?label) = "nl")
  OPTIONAL { ?subject wdt:P299 ?numeric . }
  OPTIONAL { ?subject wdt:P625 ?coordinate . }
  ${CAPITAL_PATTERNS}
} GROUP BY ?iso`;

  const facts = new Map<string, CountryFacts & { label: string }>();
  for (const binding of await askWikidata(query)) {
    const parsed = parseSubjectBinding(binding);
    if (parsed) {
      facts.set(parsed.iso, {
        ...parsed.facts,
        label: NAME_OVERRIDES[parsed.iso] ?? parsed.label,
        numeric: parsed.numeric,
      });
    }
  }
  return facts;
}

/**
 * The twelve provinces of the Netherlands (Wikidata P31 Q134390) with their
 * ISO 3166-2 code, Dutch name, capital, coordinates and flag on Commons.
 */
async function fetchProvinces(): Promise<Map<string, ProvinceFacts & { label: string }>> {
  const query = `SELECT ?iso (SAMPLE(?label) AS ?label) (SAMPLE(?coordinate) AS ?coordinate) (SAMPLE(?flag) AS ?flag) ${CAPITAL_COLUMNS} WHERE {
  ?subject wdt:P31 wd:${PROVINCE_CLASS} ;
           wdt:P300 ?iso ;
           rdfs:label ?label .
  FILTER(lang(?label) = "nl")
  OPTIONAL { ?subject wdt:P625 ?coordinate . }
  OPTIONAL { ?subject wdt:P41 ?flag . }
  ${CAPITAL_PATTERNS}
} GROUP BY ?iso`;

  const provinces = new Map<string, ProvinceFacts & { label: string }>();
  for (const binding of await askWikidata(query)) {
    const parsed = parseSubjectBinding(binding);
    if (!parsed?.flagFile) {
      console.warn("Wikidata mist gegevens voor een provincie; overgeslagen");
      continue;
    }
    provinces.set(parsed.iso, {
      ...parsed.facts,
      label: parsed.label,
      flagFile: parsed.flagFile,
    });
  }
  return provinces;
}

/** `http://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Drenthe.svg` */
function commonsFileName(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  const marker = "/Special:FilePath/";
  const index = url.indexOf(marker);
  const name = index === -1 ? url.split("/").pop() : url.slice(index + marker.length);
  return name ? decodeURIComponent(name) : undefined;
}

function slugFor(code: string, continent: string): Slug {
  const override = CONTINENT_OVERRIDES[code];
  if (override) {
    return override;
  }
  const slug = CONTINENT_SLUGS[continent as keyof typeof CONTINENT_SLUGS];
  if (!slug) {
    throw new Error(`Onbekend continent "${continent}" voor ${code}`);
  }
  return slug;
}

function toCountry(
  code: string,
  facts: CountryFacts & { label: string },
  flagIcons: Map<string, FlagIconsCountry>,
): Country | undefined {
  if (EXCLUDED_CODES.has(code)) {
    return undefined;
  }
  const source = flagIcons.get(code);
  if (!source) {
    console.warn(`Geen vlag gevonden voor ${code}; overgeslagen`);
    return undefined;
  }
  return {
    code: code.toLowerCase(),
    name: facts.label,
    region: slugFor(code, source.continent),
    capital: facts.capital,
    numeric: facts.numeric,
    latitude: facts.latitude,
    longitude: facts.longitude,
  };
}

function toProvince(code: string, facts: ProvinceFacts & { label: string }): ProvinceSource {
  return {
    code: code.toLowerCase(),
    name: facts.label,
    capital: facts.capital,
    latitude: facts.latitude,
    longitude: facts.longitude,
    flagFile: facts.flagFile,
  };
}

function compareCountries(left: Country, right: Country): number {
  const continent = CONTINENT_ORDER.indexOf(left.region) - CONTINENT_ORDER.indexOf(right.region);
  return continent !== 0 ? continent : left.name.localeCompare(right.name, "nl");
}

function compareProvinces(left: Province, right: Province): number {
  return left.name.localeCompare(right.name, "nl");
}

async function collectGeography(): Promise<{
  countries: Country[];
  provinces: ProvinceSource[];
}> {
  const [flagIcons, states, provinces] = await Promise.all([
    fetchFlagIconsCountries(),
    fetchSovereignStates(),
    fetchProvinces(),
  ]);

  const countries = [...states]
    .flatMap(([code, entry]) => {
      const country = toCountry(code, entry, flagIcons);
      return country ? [country] : [];
    })
    .sort(compareCountries);
  const provinceList = [...provinces]
    .map(([code, entry]) => toProvince(code, entry))
    .sort(compareProvinces);

  return { countries, provinces: provinceList };
}

function renderCountryData(countries: readonly Country[]): string {
  const entries = countries
    .map(
      (country) => `  {
    code: "${country.code}",
    name: "${country.name}",
    region: "${country.region}",
    capital: "${country.capital}",
    numeric: "${country.numeric}",
    latitude: ${country.latitude},
    longitude: ${country.longitude},
  },`,
    )
    .join("\n");

  return `import type { Country } from "./types";

/**
 * Alle landen met hun continent, hoofdstad, ISO 3166-1 numeric-code en
 * coördinaten (het middelpunt van het land).
 *
 * Gegenereerd door \`scripts/generate-geography.ts\`; niet met de hand aanpassen.
 * Bronnen: flag-icons ${FLAG_ICONS_VERSION} (MIT) voor het continent en de
 * vlaggen, Wikidata (CC0) voor de namen, hoofdsteden, numeric-codes en
 * coördinaten. Zie docs/adr/0015-vlaggenspel.md en docs/adr/0016-wereldkaart.md.
 */
export const COUNTRIES: readonly Country[] = [
${entries}
];
`;
}

function renderProvinceData(provinces: readonly Province[]): string {
  const entries = provinces
    .map(
      (province) => `  {
    code: "${province.code}",
    name: "${province.name}",
    region: "nederland",
    capital: "${province.capital}",
    latitude: ${province.latitude},
    longitude: ${province.longitude},
  },`,
    )
    .join("\n");

  return `import type { Province } from "./types";

/**
 * De twaalf provincies van Nederland met hun hoofdstad en coördinaten. De code
 * is de ISO 3166-2-code in kleine letters en is tegelijk de bestandsnaam van de
 * vlag in \`apps/games/public/flags\`.
 *
 * Gegenereerd door \`scripts/generate-geography.ts\`; niet met de hand aanpassen.
 * Bronnen: Wikidata (CC0) voor de namen, hoofdsteden, codes en coördinaten,
 * Wikimedia Commons (publiek domein) voor de vlaggen. Zie
 * docs/adr/0015-vlaggenspel.md.
 */
export const PROVINCES: readonly Province[] = [
${entries}
];
`;
}

async function writeIfChanged(file: string, content: string | Uint8Array): Promise<boolean> {
  const previous = existsSync(file) ? await readFile(file) : undefined;
  const next = typeof content === "string" ? Buffer.from(content, "utf8") : Buffer.from(content);
  if (previous?.equals(next)) {
    return false;
  }
  await writeFile(file, next);
  return true;
}

async function downloadCountryFlags(countries: readonly Country[]): Promise<void> {
  await mkdir(ASSET_DIR, { recursive: true });
  let written = 0;
  let bytes = 0;

  for (const country of countries) {
    const svg = await fetchText(`${FLAG_ICONS_CDN}/flags/4x3/${country.code}.svg`);
    if (await writeIfChanged(path.join(ASSET_DIR, `${country.code}.svg`), svg)) {
      written += 1;
    }
    bytes += Buffer.byteLength(svg, "utf8");
  }

  console.log(
    `Landenvlaggen: ${countries.length} stuks, ${written} geschreven, ${countries.length - written} ongewijzigd, ${Math.round(bytes / 1024)} KB totaal`,
  );
}

interface CommonsImageInfo {
  url: string;
  licence: string;
}

/** Walks nested records, returning undefined as soon as a step is not a record. */
function nestedRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> | undefined {
  let current: unknown = value;
  for (const key of keys) {
    current = isRecord(current) ? current[key] : undefined;
  }
  return isRecord(current) ? current : undefined;
}

/** Reads a string from nested records; "" and missing keys give undefined. */
function nestedString(value: unknown, keys: readonly string[]): string | undefined {
  let current: unknown = value;
  for (const key of keys) {
    current = isRecord(current) ? current[key] : undefined;
  }
  return typeof current === "string" && current.length > 0 ? current : undefined;
}

function parseCommonsImageInfo(payload: unknown): CommonsImageInfo | undefined {
  const pages = nestedRecord(payload, ["query", "pages"]);
  const first = pages ? Object.values(pages).find(isRecord) : undefined;
  const info = first && Array.isArray(first.imageinfo) ? first.imageinfo[0] : undefined;
  if (!isRecord(info)) {
    return undefined;
  }
  const url = nestedString(info, ["url"]);
  const licence = nestedString(info, ["extmetadata", "LicenseShortName", "value"]);
  if (!url || !licence) {
    return undefined;
  }
  return { url: url.split("?")[0] ?? url, licence: licence.toLowerCase() };
}

/** Looks up the file on Commons; a missing page means no usable imageinfo. */
async function commonsImageInfo(fileName: string): Promise<CommonsImageInfo | undefined> {
  const payload = await fetchJson(
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata&titles=${encodeURIComponent(`File:${fileName}`)}`,
    { "User-Agent": USER_AGENT },
  );
  return parseCommonsImageInfo(payload);
}

/**
 * Downloads one province flag, but only when Commons reports it as public
 * domain or CC0, so the app never has to carry an attribution obligation.
 */
async function fetchProvinceFlag(province: ProvinceSource): Promise<string> {
  const info = await commonsImageInfo(province.flagFile);
  if (!info || !ACCEPTED_LICENCES.some((licence) => info.licence.startsWith(licence))) {
    throw new Error(
      `${province.flagFile} heeft geen vrije licentie (${info?.licence ?? "onbekend"})`,
    );
  }

  return fetchText(info.url, { "User-Agent": USER_AGENT });
}

async function downloadProvinceFlags(provinces: readonly ProvinceSource[]): Promise<void> {
  await mkdir(ASSET_DIR, { recursive: true });
  let written = 0;
  let bytes = 0;

  for (const province of provinces) {
    const svg = await fetchProvinceFlag(province);
    if (await writeIfChanged(path.join(ASSET_DIR, `${province.code}.svg`), svg)) {
      written += 1;
    }
    bytes += Buffer.byteLength(svg, "utf8");
    await sleep(1000);
  }

  console.log(
    `Provincievlaggen: ${provinces.length} stuks, ${written} geschreven, ${provinces.length - written} ongewijzigd, ${Math.round(bytes / 1024)} KB totaal`,
  );
}

async function downloadAtlas(): Promise<void> {
  const atlas = await fetchText(WORLD_ATLAS_URL);
  const changed = await writeIfChanged(ATLAS_FILE, atlas);
  console.log(
    `Wereldkaart: ${changed ? "geschreven" : "ongewijzigd"}, ${Math.round(Buffer.byteLength(atlas, "utf8") / 1024)} KB in ${ATLAS_FILE}`,
  );
}

async function writeDataFiles(
  countries: readonly Country[],
  provinces: readonly Province[],
): Promise<void> {
  await writeFile(DATA_FILE, renderCountryData(countries), "utf8");
  console.log(`Landen: ${countries.length} in ${DATA_FILE}`);
  for (const continent of CONTINENT_ORDER) {
    const count = countries.filter((country) => country.region === continent).length;
    console.log(`  ${continent}: ${count}`);
  }

  await writeFile(PROVINCE_DATA_FILE, renderProvinceData(provinces), "utf8");
  console.log(`Provincies: ${provinces.length} in ${PROVINCE_DATA_FILE}`);
}

function codesInData(data: string): string[] {
  return [...data.matchAll(/code: "([a-z-]{2,6})"/g)].map((match) => match[1] as string);
}

/**
 * A subject is fine when its flag exists, is a real SVG and does not load
 * anything from another host. The app builds the same paths at runtime.
 */
async function assetProblems(code: string): Promise<string[]> {
  const file = path.join(ASSET_DIR, `${code}.svg`);
  if (!existsSync(file)) {
    return [`geen vlag voor ${code}`];
  }

  const svg = await readFile(file, "utf8");
  const problems: string[] = [];
  if (!svg.includes("<svg")) {
    problems.push(`${code}.svg is geen SVG`);
  }
  if (EXTERNAL_REFERENCE.test(svg)) {
    problems.push(`${code}.svg verwijst naar een externe host`);
  }
  return problems;
}

function orphanFiles(files: readonly string[], codes: readonly string[]): string[] {
  const known = new Set(codes);
  return files
    .filter((file) => !known.has(file.replace(/\.svg$/, "")))
    .map((file) => `${file} hoort bij geen enkel onderwerp`);
}

/**
 * Offline check: every country and province has a local flag and every flag
 * belongs to a subject, and no SVG fetches something from another host.
 */
async function checkAssets(): Promise<void> {
  const codes = [
    ...codesInData(await readFile(DATA_FILE, "utf8")),
    ...codesInData(await readFile(PROVINCE_DATA_FILE, "utf8")),
  ];
  const files = (await readdir(ASSET_DIR)).filter((file) => file.endsWith(".svg"));
  const perSubject = await Promise.all(codes.map(assetProblems));
  const problems = [...perSubject.flat(), ...orphanFiles(files, codes)];

  if (problems.length > 0) {
    console.error(`Vlaggencontrole mislukt:\n  ${problems.join("\n  ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Vlaggencontrole ok: ${codes.length} vlaggen, ${files.length} bestanden`);
}

interface AtlasTopology {
  objects?: {
    countries?: { geometries?: readonly { id?: string }[] };
    land?: unknown;
  };
}

/**
 * Offline check: the atlas is the expected Natural Earth topology and still
 * has the outlines the map needs. Countries without an outline (small island
 * states) are fine; they get a marker on the map instead.
 */
function atlasProblems(topology: unknown): string[] {
  const objects = isRecord(topology) ? (topology as AtlasTopology).objects : undefined;
  const geometries = objects?.countries?.geometries ?? [];
  const ids = new Set(geometries.map((geometry) => String(geometry.id).padStart(3, "0")));
  const problems = REQUIRED_ATLAS_IDS.filter((id) => !ids.has(id)).map(
    (id) => `geen omtrek voor ${id}`,
  );

  if (!objects?.land) {
    problems.push("geen land-object");
  }
  if (geometries.length < MIN_ATLAS_COUNTRIES) {
    problems.push(`te weinig landen (${geometries.length})`);
  }
  return problems;
}

async function checkAtlas(): Promise<void> {
  if (!existsSync(ATLAS_FILE)) {
    console.error(`Wereldkaartcontrole mislukt: ${ATLAS_FILE} ontbreekt`);
    process.exitCode = 1;
    return;
  }

  const topology: unknown = JSON.parse(await readFile(ATLAS_FILE, "utf8"));
  const problems = atlasProblems(topology);
  if (problems.length > 0) {
    console.error(`Wereldkaartcontrole mislukt:\n  ${problems.join("\n  ")}`);
    process.exitCode = 1;
    return;
  }

  const data = await readFile(DATA_FILE, "utf8");
  const numeric = [...data.matchAll(/numeric: "(\d{3})"/g)].length;
  const geometries = (topology as AtlasTopology).objects?.countries?.geometries ?? [];
  console.log(
    `Wereldkaartcontrole ok: ${geometries.length} omtrekken, ${numeric} landen met een numeric-code`,
  );
}

const args = new Set(process.argv.slice(2));
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(repositoryRoot);

if (args.has("--check")) {
  await checkAssets();
  await checkAtlas();
} else {
  const { countries, provinces } = await collectGeography();
  await writeDataFiles(countries, provinces);
  await downloadCountryFlags(countries);
  await downloadProvinceFlags(provinces);
  await downloadAtlas();
}
