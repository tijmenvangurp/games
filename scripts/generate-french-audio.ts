import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { LESSON_ANIMAUX } from "../libs/entities/french/model/lesson-animaux.ts";

/**
 * Genereert de Franse audiofragmenten voor de les.
 *
 * Voorbeeld:
 *   TTS_BASE_URL=http://localhost:8000/v1 \
 *   TTS_MODEL=speaches-ai/piper-fr_FR-tom-medium \
 *   TTS_VOICE=tom \
 *   pnpm exec tsx scripts/generate-french-audio.ts
 *
 * De URL en een eventuele sleutel horen in de omgeving, nooit in de repo.
 * De app zelf doet tijdens het spelen geen TTS-aanroep: zij leest de MP3's
 * uit `apps/games/public/audio/fr/`.
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
  force: boolean;
  dryRun: boolean;
}

type LessonItem = (typeof LESSON_ANIMAUX.items)[number];

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
  return { only, force: args.has("--force"), dryRun: args.has("--dry-run") };
}

// fallow-ignore-next-line complexity
function looksLikeMp3(bytes: Uint8Array): boolean {
  if (bytes.length < 3) {
    return false;
  }
  const isId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const isFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  return isId3 || isFrame;
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

function wordClip(item: LessonItem): Clip {
  return { id: item.id, input: item.audioText ?? item.fr };
}

function exampleClip(item: LessonItem): Clip | null {
  if (!item.example) {
    return null;
  }
  return {
    id: `${item.id}-example`,
    input: item.example.audioText ?? item.example.fr,
  };
}

function clipsFor(items: readonly LessonItem[]): Clip[] {
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

async function generateClip(clip: Clip, config: Config, options: Options): Promise<void> {
  if (shouldSkip(clip, options)) {
    console.log(`skip ${clip.id} (bestaat al)`);
    return;
  }

  console.log(`${actionLabel(options)} ${clip.id}: ${clip.input}`);
  if (!options.dryRun) {
    await writeAudio(clip, config);
  }
}

function selectItems(options: Options): LessonItem[] {
  const items = LESSON_ANIMAUX.items.filter(
    (item) => item.reviewed && (!options.only || item.id === options.only),
  );
  if (items.length === 0) {
    console.error(
      options.only ? `Geen gereviewd item met id "${options.only}".` : "Geen gereviewde items.",
    );
    process.exit(1);
  }
  return items;
}

async function main(): Promise<void> {
  const config = readConfig();
  const options = readOptions();
  const items = selectItems(options);

  if (!options.dryRun) {
    await mkdir(outputDirectory, { recursive: true });
  }

  for (const clip of clipsFor(items)) {
    await generateClip(clip, config, options);
  }
}

await main();
