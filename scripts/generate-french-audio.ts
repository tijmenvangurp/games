import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  FRENCH_CURRICULUM,
  allFrenchItems,
  validateCurriculum,
} from "../libs/entities/french/index.ts";
import type { FrenchItem } from "../libs/entities/french/index.ts";

/**
 * Genereert de Franse audiofragmenten voor alle gepubliceerde lessen.
 *
 * Voorbeeld:
 *   TTS_BASE_URL=http://localhost:8000/v1 \
 *   TTS_MODEL=speaches-ai/piper-fr_FR-tom-medium \
 *   TTS_VOICE=tom \
 *   pnpm exec tsx scripts/generate-french-audio.ts
 *
 * `--check` controleert de content en de aanwezigheid van alle audio zonder
 * de TTS-server nodig te hebben. De URL en sleutel horen in de omgeving,
 * nooit in de repo.
 */
interface Config {
  baseUrl: string;
  model: string;
  voice: string;
  apiKey?: string;
  speed: number;
}

interface Options {
  only?: string;
  lesson?: string;
  force: boolean;
  dryRun: boolean;
  check: boolean;
}

const outputDirectory = join("apps", "games", "public", "audio", "fr");

function readBaseUrl(): string {
  const baseUrl = process.env.TTS_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    console.error(
      "TTS_BASE_URL ontbreekt. Zet bijvoorbeeld TTS_BASE_URL=http://localhost:8000/v1 in je shell.",
    );
    process.exit(1);
  }
  return baseUrl;
}

function isValidSpeed(speed: number): boolean {
  return Number.isFinite(speed) && speed >= 0.25 && speed <= 4;
}

function readSpeed(): number {
  const speed = Number(process.env.TTS_SPEED ?? "1");
  if (!isValidSpeed(speed)) {
    console.error("TTS_SPEED moet tussen 0.25 en 4 liggen.");
    process.exit(1);
  }
  return speed;
}

function readConfig(): Config {
  return {
    baseUrl: readBaseUrl(),
    model: process.env.TTS_MODEL ?? "speaches-ai/piper-fr_FR-tom-medium",
    voice: process.env.TTS_VOICE ?? "tom",
    apiKey: process.env.TTS_API_KEY,
    speed: readSpeed(),
  };
}

function readOptions(): Options {
  const args = new Set(process.argv.slice(2));
  const only = [...args]
    .find((argument) => argument.startsWith("--only="))
    ?.slice("--only=".length);
  const lesson = [...args]
    .find((argument) => argument.startsWith("--lesson="))
    ?.slice("--lesson=".length);
  return {
    only,
    lesson,
    force: args.has("--force"),
    dryRun: args.has("--dry-run"),
    check: args.has("--check"),
  };
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

async function requestSpeech(config: Config, input: string): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        voice: config.voice,
        input,
        response_format: "mp3",
        speed: config.speed,
      }),
    });
  } catch {
    // Never include the private endpoint in an error message or stack.
    throw new Error("TTS-verzoek mislukt (netwerk).");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`TTS gaf ${response.status}: ${detail.slice(0, 200)}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

interface Clip {
  id: string;
  input: string;
}

function wordClip(item: FrenchItem): Clip {
  return { id: item.id, input: item.audioText ?? item.fr };
}

function exampleClip(item: FrenchItem): Clip | null {
  if (!item.example) {
    return null;
  }
  return {
    id: `${item.id}-example`,
    input: item.example.audioText ?? item.example.fr,
  };
}

function clipsFor(items: readonly FrenchItem[]): Clip[] {
  const clips: Clip[] = [];
  for (const item of items) {
    clips.push(wordClip(item));
    const example = exampleClip(item);
    if (example) {
      clips.push(example);
    }
  }
  return clips;
}

function shouldSkip(clip: Clip, options: Options): boolean {
  const outputPath = join(outputDirectory, `${clip.id}.mp3`);
  return !options.force && existsSync(outputPath);
}

async function writeAudio(clip: Clip, config: Config): Promise<void> {
  const bytes = await requestSpeech(config, clip.input);
  if (!looksLikeMp3(bytes)) {
    throw new Error(`TTS gaf geen MP3 voor ${clip.id} (${bytes.byteLength} bytes).`);
  }
  const outputPath = join(outputDirectory, `${clip.id}.mp3`);
  await writeFile(outputPath, bytes);
  console.log(`  -> ${outputPath} (${bytes.byteLength} bytes)`);
}

function actionLabel(options: Options): string {
  return options.dryRun ? "dry-run" : "genereer";
}

async function generateClip(clip: Clip, config: Config | null, options: Options): Promise<void> {
  if (shouldSkip(clip, options)) {
    console.log(`skip ${clip.id} (bestaat al)`);
    return;
  }

  console.log(`${actionLabel(options)} ${clip.id}: ${clip.input}`);
  if (!options.dryRun && config) {
    await writeAudio(clip, config);
  }
}

function selectItems(options: Options): FrenchItem[] {
  const lessons = options.lesson
    ? FRENCH_CURRICULUM.filter((lesson) => lesson.id === options.lesson)
    : FRENCH_CURRICULUM;
  const items = lessons
    .flatMap((lesson) => lesson.items)
    .filter((item) => item.reviewed && (!options.only || item.id === options.only));

  if (items.length === 0) {
    console.error(
      options.only
        ? `Geen gereviewd item met id "${options.only}".`
        : "Geen gereviewde items gevonden.",
    );
    process.exit(1);
  }
  return items;
}

function checkAudio(): void {
  const issues = validateCurriculum(FRENCH_CURRICULUM, {
    audioExists: (fileName) => existsSync(join(outputDirectory, fileName)),
  });
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }
  const reviewed = allFrenchItems().filter((item) => item.reviewed).length;
  console.log(`Audio en content zijn in orde (${reviewed} items).`);
}

async function runGeneration(options: Options): Promise<void> {
  const items = selectItems(options);
  if (!options.dryRun) {
    await mkdir(outputDirectory, { recursive: true });
  }

  const config = options.dryRun ? null : readConfig();
  for (const clip of clipsFor(items)) {
    await generateClip(clip, config, options);
  }
}

async function main(): Promise<void> {
  const options = readOptions();
  if (options.check) {
    checkAudio();
    return;
  }
  await runGeneration(options);
}

await main();
