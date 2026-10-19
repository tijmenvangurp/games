import { existsSync } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve, sep } from "node:path";
import {
  AANBEVOLEN_VARIANTEN,
  KLANKEN,
  type KlankMapping,
  type KlankType,
  type KlankVariant,
} from "./sounds-data.ts";

/**
 * Genereert prototype-audio voor losse Nederlandse klanken.
 *
 * Het script leest de endpoint-URL, het model, de stem en de sleutel uit
 * environment variables. Zet die nooit in de repo. Gebruik de private
 * TTS-helper uit de skill `generate-game-audio`; die vult de variabelen in
 * zonder dat de waarden in de chat of in een proceslijst komen.
 *
 * Voorbeeld (via de helper):
 *   generate-audio.ts -- --generator=scripts/generate-sounds.ts \
 *     --only=i,k,m,s,p,v,e,n,t,a --variant=fonetisch --label=nathalie
 */

type ManifestType = KlankType;

interface ManifestVariant {
  id: string;
  label: string;
  prompt: string;
  /** Stem-slug -> pad relatief ten opzichte van de outputmap. */
  files: Record<string, string>;
}

interface ManifestSound {
  teken: string;
  type: ManifestType;
  variants: ManifestVariant[];
}

interface ManifestVoice {
  slug: string;
  model: string;
  voice: string;
  label: string;
}

interface Manifest {
  version: 1;
  generatedAt: string;
  voices: ManifestVoice[];
  sounds: Record<string, ManifestSound>;
}

interface Config {
  baseUrl: string;
  model: string;
  voice: string;
  apiKey?: string;
  speed: number;
}

interface Options {
  only: Set<string> | null;
  variant: Set<string> | null;
  out: string;
  force: boolean;
  dryRun: boolean;
  listModels: boolean;
  help: boolean;
  serve: boolean;
  serveOnly: boolean;
  port: number;
  model?: string;
  voice?: string;
  label?: string;
  speed?: number;
}

interface VoiceChoice {
  model: string;
  voice: string;
  label: string;
  slug: string;
}

const DEFAULT_MODEL = "speaches-ai/piper-nl_BE-nathalie-medium";
const DEFAULT_VOICE = "nathalie";
const DEFAULT_OUT = join("prototype", "sounds");
const DEFAULT_PORT = 4174;

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function readList(name: string): Set<string> | null {
  const raw = readFlag(name);
  if (!raw) {
    return null;
  }
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? new Set(values) : null;
}

function parseNumber(raw: string, label: string, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    console.error(`${label} moet tussen ${min} en ${max} liggen.`);
    process.exit(1);
  }
  return value;
}

function readSpeed(): number | undefined {
  const raw = readFlag("speed");
  return raw ? parseNumber(raw, "--speed", 0.25, 4) : undefined;
}

function parsePort(raw: string): number {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("--port moet een geldig poortnummer zijn.");
    process.exit(1);
  }
  return port;
}

function readPort(): number {
  const raw = readFlag("port");
  return raw ? parsePort(raw) : DEFAULT_PORT;
}

function readOptions(): Options {
  const args = new Set(process.argv.slice(2));
  return {
    only: readList("only"),
    variant: readList("variant"),
    out: readFlag("out") ?? DEFAULT_OUT,
    force: args.has("--force"),
    dryRun: args.has("--dry-run"),
    listModels: args.has("--list-models"),
    help: args.has("--help"),
    serve: args.has("--serve"),
    serveOnly: args.has("--serve-only"),
    port: readPort(),
    model: readFlag("model"),
    voice: readFlag("voice"),
    label: readFlag("label"),
    speed: readSpeed(),
  };
}

function readBaseUrl(): string {
  const baseUrl = process.env.TTS_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    console.error(
      "TTS_BASE_URL ontbreekt. Gebruik de private TTS-helper; zet de waarde nooit in de repo.",
    );
    process.exit(1);
  }
  return baseUrl;
}

function readConfig(options: Options, model: string, voice: string): Config {
  return {
    baseUrl: readBaseUrl(),
    model,
    voice,
    apiKey: process.env.TTS_API_KEY,
    speed: options.speed ?? parseNumber(process.env.TTS_SPEED ?? "1", "TTS_SPEED", 0.25, 4),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isManifest(value: unknown): value is Manifest {
  return (
    isRecord(value) && value.version === 1 && Array.isArray(value.voices) && isRecord(value.sounds)
  );
}

function emptyManifest(): Manifest {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    voices: [],
    sounds: {},
  };
}

async function loadManifest(path: string): Promise<Manifest> {
  if (!existsSync(path)) {
    return emptyManifest();
  }

  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    return isManifest(parsed) ? parsed : emptyManifest();
  } catch {
    return emptyManifest();
  }
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "stem";
}

function pick(value: string | undefined, env: string | undefined, fallback: string): string {
  return value ?? env ?? fallback;
}

function resolveVoice(options: Options): VoiceChoice {
  const model = pick(options.model, process.env.TTS_MODEL, DEFAULT_MODEL);
  const voice = pick(options.voice, process.env.TTS_VOICE, DEFAULT_VOICE);
  const label = options.label ?? `${model.split("/").pop() ?? model}-${voice}`;
  return { model, voice, label, slug: slugify(label) };
}

function relativeFile(slug: string, klank: KlankMapping, variant: KlankVariant): string {
  return `${slug}/${klank.id}/${variant.id}.mp3`;
}

function isId3Tag(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
}

function isMp3Frame(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

function looksLikeMp3(bytes: Uint8Array): boolean {
  return isId3Tag(bytes) || isMp3Frame(bytes);
}

function speechHeaders(config: Config): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
  };
}

function speechBody(config: Config, input: string, speed: number): string {
  return JSON.stringify({
    model: config.model,
    voice: config.voice,
    input,
    response_format: "mp3",
    speed,
  });
}

async function postSpeech(config: Config, input: string, speed: number): Promise<Response> {
  try {
    return await fetch(`${config.baseUrl}/audio/speech`, {
      method: "POST",
      headers: speechHeaders(config),
      body: speechBody(config, input, speed),
    });
  } catch {
    throw new Error("TTS-verzoek mislukt (netwerk).");
  }
}

async function requestSpeech(config: Config, input: string, speed: number): Promise<Uint8Array> {
  const response = await postSpeech(config, input, speed);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`TTS gaf ${response.status}: ${detail.slice(0, 200)}`);
  }

  try {
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    // Never include the private endpoint, IP addresses or stack in the error.
    throw new Error("TTS-verzoek mislukt (netwerk).");
  }
}

async function fetchModels(config: Config): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/models`, {
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
    });
  } catch {
    throw new Error("Kon de modellenlijst niet ophalen (netwerk).");
  }

  if (!response.ok) {
    throw new Error(`Modellenlijst gaf ${response.status}.`);
  }

  return response.json();
}

function modelEntries(data: unknown): readonly unknown[] {
  return isRecord(data) && Array.isArray(data.data) ? data.data : [];
}

async function listModels(config: Config): Promise<void> {
  const entries = modelEntries(await fetchModels(config));
  for (const entry of entries) {
    if (isRecord(entry) && typeof entry.id === "string") {
      console.log(entry.id);
    }
  }
}

function upsertVoice(manifest: Manifest, voice: ManifestVoice): void {
  const existing = manifest.voices.find((item) => item.slug === voice.slug);
  if (existing) {
    existing.model = voice.model;
    existing.voice = voice.voice;
    existing.label = voice.label;
    return;
  }
  manifest.voices.push(voice);
}

function upsertSound(manifest: Manifest, klank: KlankMapping): ManifestSound {
  const previous = manifest.sounds[klank.id]?.variants ?? [];
  const filesById = new Map(previous.map((variant) => [variant.id, variant.files]));

  const sound: ManifestSound = {
    teken: klank.teken,
    type: klank.type,
    variants: klank.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      prompt: variant.ttsPrompt,
      files: filesById.get(variant.id) ?? {},
    })),
  };
  manifest.sounds[klank.id] = sound;
  return sound;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderRow(
  variant: ManifestVariant,
  voices: readonly ManifestVoice[],
  recommended: boolean,
): string {
  const cells = voices
    .map((voice) => {
      const file = variant.files[voice.slug];
      return file
        ? `<td><audio controls preload="none" src="${escapeHtml(file)}"></audio></td>`
        : "<td>—</td>";
    })
    .join("");
  const label = `${escapeHtml(variant.label)}${
    recommended ? ' <span class="badge">aanbevolen</span>' : ""
  }`;
  return `<tr class="${recommended ? "recommended" : ""}"><td>${label}</td><td><code>${escapeHtml(
    variant.prompt,
  )}</code></td>${cells}</tr>`;
}

function renderSection(
  sound: ManifestSound,
  voices: readonly ManifestVoice[],
  voiceHeaders: string,
): string {
  const recommendedId = AANBEVOLEN_VARIANTEN[sound.teken];
  const rows = sound.variants
    .filter((variant) => Object.keys(variant.files).length > 0)
    .map((variant) => renderRow(variant, voices, variant.id === recommendedId))
    .join("");
  if (rows.length === 0) {
    return "";
  }

  return `<section>
  <h2>${escapeHtml(sound.teken)} <small>${escapeHtml(sound.type)}</small></h2>
  <table>
    <thead><tr><th>Variant</th><th>TTS-prompt</th>${voiceHeaders}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`;
}

function renderPage(manifest: Manifest): string {
  const voices = manifest.voices;
  const voiceHeaders = voices
    .map(
      (voice) =>
        `<th>${escapeHtml(voice.label)}<br><small>${escapeHtml(voice.model)} · ${escapeHtml(
          voice.voice,
        )}</small></th>`,
    )
    .join("");
  const sections = Object.values(manifest.sounds)
    .map((sound) => renderSection(sound, voices, voiceHeaders))
    .filter((section) => section.length > 0)
    .join("\n");

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Klankprototype</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 70rem; padding: 0 1rem; color: #222; }
    h1 { margin-bottom: .25rem; }
    h2 { margin-top: 2.5rem; border-bottom: 1px solid #ddd; padding-bottom: .25rem; }
    h2 small { color: #666; font-size: .6em; font-weight: normal; }
    table { border-collapse: collapse; width: 100%; margin-top: .5rem; }
    th, td { border: 1px solid #ddd; padding: .5rem; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    code { background: #f3f3f3; padding: .1rem .3rem; border-radius: .25rem; }
    audio { width: 180px; }
    .note { color: #555; }
    tr.recommended td { background: #e8f5e9; border-color: #2e7d32; }
    tr.recommended td:first-child { font-weight: 700; }
    .badge { display: inline-block; margin-left: .35rem; border-radius: .25rem; background: #2e7d32; color: #fff; padding: 0 .35rem; font-size: .7rem; vertical-align: middle; }
  </style>
</head>
<body>
  <h1>Klankprototype</h1>
  <p class="note">Beluister per klank de varianten en per stem. De groene rij is onze aanbevolen keuze; geef alleen door waar die niet klopt.</p>
  <p class="note">Voor continuanten (l, m, s, v, z) is een aangehouden klank het didactische doel; voor ng en ch is een heel woord de beste context.</p>
  <p class="note">Gegenereerd op ${escapeHtml(manifest.generatedAt)}.</p>
  ${sections}
  <p class="note">Prototype. Zie <a href="./LICENSES.md">LICENSES.md</a> voor de herkomst en licenties van de stemmen.</p>
</body>
</html>
`;
}

const MIME_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

function isInside(root: string, filePath: string): boolean {
  return filePath === root || filePath.startsWith(`${root}${sep}`);
}

function safePath(root: string, requestUrl: string | undefined): string | null {
  const url = new URL(requestUrl ?? "/", "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = resolve(root, relative);
  return isInside(root, filePath) ? filePath : null;
}

function sendFile(response: ServerResponse, filePath: string): void {
  void readFile(filePath)
    .then((data) => {
      const type = MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
      response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      response.end(data);
    })
    .catch(() => {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Niet gevonden");
    });
}

function serveOutput(options: Options): void {
  const root = resolve(options.out);
  if (!existsSync(join(root, "index.html"))) {
    console.error(`Geen beluisterpagina in ${options.out}. Genereer eerst audio.`);
    process.exit(1);
  }

  const server = createServer((request, response) => {
    const filePath = safePath(root, request.url);
    if (!filePath) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Verboden");
      return;
    }
    sendFile(response, filePath);
  });

  server.listen(options.port, "127.0.0.1", () => {
    console.log(`Beluisterpagina: http://localhost:${options.port}/`);
    console.log("Stop met Ctrl+C.");
  });
}

function printHelp(): void {
  console.log(`Gebruik:
  corepack pnpm exec tsx scripts/generate-sounds.ts [opties]

Opties:
  --only=a,e,i,k       Alleen deze klank-id's
  --variant=letter,fonetisch
                       Alleen deze varianten
  --model=<id>         TTS-model (standaard ${DEFAULT_MODEL})
  --voice=<naam>       Stem (standaard ${DEFAULT_VOICE})
  --label=<naam>       Naam van de stem op de beluisterpagina
  --speed=<getal>      Snelheid 0.25–4 (standaard 1)
  --out=<map>          Outputmap (standaard ${DEFAULT_OUT})
  --force              Bestaande bestanden overschrijven
  --dry-run            Alleen tonen wat er gegenereerd zou worden
  --list-models        Beschikbare TTS-modellen tonen
  --serve              Na het genereren een lokale beluisterpagina starten
  --serve-only         Alleen de beluisterpagina serveren (geen TTS)
  --port=<getal>       Poort voor --serve (standaard ${DEFAULT_PORT})
  --help               Deze uitleg

Gebruik de private TTS-helper uit de skill generate-game-audio voor de
endpoint en sleutel. Zet die waarden nooit in de repo.`);
}

function selectKlanken(options: Options): readonly KlankMapping[] {
  const selected = KLANKEN.filter((klank) => !options.only || options.only.has(klank.id));
  if (selected.length === 0) {
    console.error("Geen klanken geselecteerd.");
    process.exit(1);
  }
  return selected;
}

function variantSelected(variant: KlankVariant, options: Options): boolean {
  return !options.variant || options.variant.has(variant.id);
}

function markFile(sound: ManifestSound, variantId: string, slug: string, file: string): void {
  const entry = sound.variants.find((item) => item.id === variantId);
  if (entry) {
    entry.files[slug] = `./${file}`;
  }
}

function skipExisting(options: Options, outputPath: string): boolean {
  return !options.force && existsSync(outputPath);
}

async function writeVariant(
  config: Config,
  variant: KlankVariant,
  outputPath: string,
  file: string,
): Promise<void> {
  const bytes = await requestSpeech(config, variant.ttsPrompt, variant.speed ?? config.speed);
  if (!looksLikeMp3(bytes)) {
    throw new Error(`TTS gaf geen MP3 voor ${file} (${bytes.byteLength} bytes).`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  console.log(`-> ${file} (${bytes.byteLength} bytes)`);
}

async function generateVariant(
  config: Config | null,
  options: Options,
  slug: string,
  klank: KlankMapping,
  variant: KlankVariant,
  sound: ManifestSound,
): Promise<void> {
  const file = relativeFile(slug, klank, variant);
  const outputPath = join(options.out, file);
  markFile(sound, variant.id, slug, file);

  if (options.dryRun) {
    console.log(`dry-run ${file}: ${variant.ttsPrompt}`);
    return;
  }

  if (skipExisting(options, outputPath)) {
    console.log(`skip ${file} (bestaat al)`);
    return;
  }

  if (!config) {
    throw new Error("TTS-configuratie ontbreekt.");
  }

  await writeVariant(config, variant, outputPath, file);
}

async function generateKlank(
  config: Config | null,
  options: Options,
  slug: string,
  klank: KlankMapping,
  manifest: Manifest,
): Promise<void> {
  const sound = upsertSound(manifest, klank);
  for (const variant of klank.variants) {
    if (variantSelected(variant, options)) {
      await generateVariant(config, options, slug, klank, variant, sound);
    }
  }
}

async function saveOutput(manifest: Manifest, outputDirectory: string): Promise<void> {
  manifest.generatedAt = new Date().toISOString();
  await mkdir(outputDirectory, { recursive: true });
  const manifestPath = join(outputDirectory, "sounds.json");
  const indexPath = join(outputDirectory, "index.html");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(indexPath, renderPage(manifest));
  console.log(`\nManifest: ${manifestPath}`);
  console.log(`Beluisterpagina: ${indexPath}`);
}

async function generate(options: Options): Promise<void> {
  const voice = resolveVoice(options);
  const selected = selectKlanken(options);
  const config = options.dryRun ? null : readConfig(options, voice.model, voice.voice);
  const manifest = await loadManifest(join(options.out, "sounds.json"));

  upsertVoice(manifest, {
    slug: voice.slug,
    model: voice.model,
    voice: voice.voice,
    label: voice.label,
  });

  for (const klank of selected) {
    await generateKlank(config, options, voice.slug, klank, manifest);
  }

  await saveOutput(manifest, options.out);
}

async function listModelsCommand(options: Options): Promise<void> {
  const voice = resolveVoice(options);
  await listModels(readConfig(options, voice.model, voice.voice));
}

async function runGenerate(options: Options): Promise<void> {
  await generate(options);
  if (options.serve) {
    serveOutput(options);
  }
}

async function main(): Promise<void> {
  const options = readOptions();
  if (options.help) {
    printHelp();
    return;
  }

  if (options.listModels) {
    await listModelsCommand(options);
    return;
  }

  if (options.serveOnly) {
    serveOutput(options);
    return;
  }

  await runGenerate(options);
}

await main();
