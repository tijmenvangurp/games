import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Generates the country list and the local flag assets for the flag game.
 *
 * Sources (see docs/adr/0015-vlaggenspel.md):
 * - flag-icons (MIT) for the SVGs and the continent of every country;
 * - Wikidata (CC0) for the Dutch country names and for the selection of
 *   sovereign states.
 *
 * Run `pnpm run flags` to regenerate, `pnpm run flags:check` to verify the
 * committed assets against the committed data list without touching the
 * network. Generated files are committed so the app itself never fetches
 * anything at runtime.
 */

const FLAG_ICONS_VERSION = "7.6.0";
const FLAG_ICONS_CDN = `https://cdn.jsdelivr.net/npm/flag-icons@${FLAG_ICONS_VERSION}`;
const DATA_FILE = "libs/entities/flag/model/countries.ts";
const ASSET_DIR = "apps/games/public/flags";

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

const USER_AGENT = "spellen-flags/1.0 (+https://github.com/tijmenvangurp/games)";

interface Country {
  code: string;
  name: string;
  continent: Slug;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

async function fetchJson(url: string, headers?: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, headers ? { headers } : undefined);
  if (!response.ok) {
    throw new Error(`${url} gaf HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} gaf HTTP ${response.status}`);
  }
  return response.text();
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

interface SparqlRow {
  iso: string;
  label: string;
}

function bindingValue(value: unknown): string | undefined {
  return isRecord(value) ? readString(value, "value") : undefined;
}

function toSparqlRow(value: unknown): SparqlRow | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const pair = [bindingValue(value.iso), bindingValue(value.label)];
  if (!isStrings(pair)) {
    return undefined;
  }
  const [iso, label] = pair;
  return { iso: iso.toUpperCase(), label };
}

function bindingsOf(payload: unknown): unknown[] {
  const results = isRecord(payload) ? payload.results : undefined;
  const bindings = isRecord(results) ? results.bindings : undefined;
  if (!Array.isArray(bindings)) {
    throw new Error("Wikidata gaf een onverwachte vorm");
  }
  return bindings;
}

/**
 * Sovereign states (Wikidata P31/P279* Q3624078) that carry an ISO 3166-1
 * alpha-2 code, with their Dutch label.
 */
async function fetchSovereignStates(): Promise<Map<string, string>> {
  const query = `SELECT DISTINCT ?iso ?label WHERE {
  ?country wdt:P31/wdt:P279* wd:Q3624078 ;
           wdt:P297 ?iso ;
           rdfs:label ?label .
  FILTER(lang(?label) = "nl")
}`;
  const payload = await fetchJson(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`,
    { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  );

  const names = new Map<string, string>();
  for (const binding of bindingsOf(payload)) {
    const row = toSparqlRow(binding);
    if (row) {
      names.set(row.iso, NAME_OVERRIDES[row.iso] ?? row.label);
    }
  }
  return names;
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
  name: string,
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
  return { code: code.toLowerCase(), name, continent: slugFor(code, source.continent) };
}

function compareCountries(left: Country, right: Country): number {
  const continent =
    CONTINENT_ORDER.indexOf(left.continent) - CONTINENT_ORDER.indexOf(right.continent);
  return continent !== 0 ? continent : left.name.localeCompare(right.name, "nl");
}

async function collectCountries(): Promise<Country[]> {
  const [flagIcons, names] = await Promise.all([fetchFlagIconsCountries(), fetchSovereignStates()]);
  const countries = [...names].flatMap(([code, name]) => {
    const country = toCountry(code, name, flagIcons);
    return country ? [country] : [];
  });

  return countries.sort(compareCountries);
}

function renderDataFile(countries: readonly Country[]): string {
  const entries = countries
    .map(
      (country) =>
        `  { code: "${country.code}", name: "${country.name}", continent: "${country.continent}" },`,
    )
    .join("\n");

  return `import type { FlagCountry } from "./types";

/**
 * Alle landen in het vlaggenspel: ISO 3166-1 alpha-2-code, Nederlandse naam en
 * continent.
 *
 * Gegenereerd door \`scripts/generate-flags.ts\`; niet met de hand aanpassen.
 * Bronnen: flag-icons ${FLAG_ICONS_VERSION} (MIT) voor het continent en de
 * vlaggen, Wikidata (CC0) voor de Nederlandse namen. Zie
 * docs/adr/0015-vlaggenspel.md.
 */
export const FLAG_COUNTRIES: readonly FlagCountry[] = [
${entries}
];
`;
}

async function writeIfChanged(file: string, content: string): Promise<boolean> {
  const previous = existsSync(file) ? await readFile(file, "utf8") : undefined;
  if (previous === content) {
    return false;
  }
  await writeFile(file, content, "utf8");
  return true;
}

async function downloadFlags(countries: readonly Country[]): Promise<void> {
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
    `Vlaggen: ${countries.length} stuks, ${written} geschreven, ${countries.length - written} ongewijzigd, ${Math.round(bytes / 1024)} KB totaal`,
  );
}

async function writeDataFile(countries: readonly Country[]): Promise<void> {
  await writeFile(DATA_FILE, renderDataFile(countries), "utf8");
  console.log(`Landen: ${countries.length} in ${DATA_FILE}`);
  for (const continent of CONTINENT_ORDER) {
    const count = countries.filter((country) => country.continent === continent).length;
    console.log(`  ${continent}: ${count}`);
  }
}

function codesInData(data: string): string[] {
  return [...data.matchAll(/code: "([a-z]{2})"/g)].map((match) => match[1] as string);
}

/**
 * A country is fine when its flag exists, is a real SVG and does not load
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
  if (/https?:\/\/(?!www\.w3\.org)/.test(svg)) {
    problems.push(`${code}.svg verwijst naar een externe host`);
  }
  return problems;
}

function orphanFiles(files: readonly string[], codes: readonly string[]): string[] {
  const known = new Set(codes);
  return files
    .filter((file) => !known.has(file.replace(/\.svg$/, "")))
    .map((file) => `${file} hoort bij geen enkel land`);
}

/**
 * Offline check: every country has a local flag and every flag belongs to a
 * country, and no SVG tries to load something from another host.
 */
async function checkAssets(): Promise<void> {
  const codes = codesInData(await readFile(DATA_FILE, "utf8"));
  const files = (await readdir(ASSET_DIR)).filter((file) => file.endsWith(".svg"));
  const perCountry = await Promise.all(codes.map(assetProblems));
  const problems = [...perCountry.flat(), ...orphanFiles(files, codes)];

  if (problems.length > 0) {
    console.error(`Vlaggencontrole mislukt:\n  ${problems.join("\n  ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Vlaggencontrole ok: ${codes.length} landen, ${files.length} bestanden`);
}

const args = new Set(process.argv.slice(2));
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(repositoryRoot);

if (args.has("--check")) {
  await checkAssets();
} else {
  const countries = await collectCountries();
  await writeDataFile(countries);
  await downloadFlags(countries);
}
