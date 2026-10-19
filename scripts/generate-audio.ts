import type { SpeechLine } from "../libs/shared/lib/speech.ts";
import {
  checkAudio,
  flattenSpeechLines,
  loadSpeechGroups,
  needsAudio,
  readLock,
  relativeAudioPath,
  textHash,
  writeAudioFile,
  writeLock,
  type AudioLock,
} from "./lib/audio-catalog.ts";
import { looksLikeMp3, NATHALIE_DEFAULTS, readTtsConfig, requestSpeechMp3 } from "./lib/tts.ts";

interface Options {
  readonly check: boolean;
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly only: ReadonlySet<string> | null;
  readonly group: ReadonlySet<string> | null;
  readonly help: boolean;
}

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function readList(name: string): ReadonlySet<string> | null {
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

function readOptions(): Options {
  const args = new Set(process.argv.slice(2));
  return {
    check: args.has("--check"),
    dryRun: args.has("--dry-run"),
    force: args.has("--force"),
    only: readList("only"),
    group: readList("group"),
    help: args.has("--help"),
  };
}

function usage(): void {
  console.log(`Gebruik: tsx scripts/generate-audio.ts [opties]

  --check           controleer catalogi, lock en MP3-bestanden zonder TTS
  --dry-run         toon wat er gegenereerd zou worden
  --force           genereer alles opnieuw
  --only=<id,id>    alleen deze spraak-id's
  --group=<folder>  alleen deze audiogroepen
  --help            deze uitleg
`);
}

async function selectedLines(options: Options) {
  const groups = await loadSpeechGroups();
  const lines = flattenSpeechLines(groups).filter((line) => {
    if (options.only && !options.only.has(line.id)) {
      return false;
    }
    if (options.group && !options.group.has(line.folder)) {
      return false;
    }
    return true;
  });

  if (lines.length === 0) {
    throw new Error("Geen spraakregels gevonden voor deze selectie.");
  }
  return lines;
}

async function runCheck(options: Options): Promise<void> {
  const lines = await selectedLines(options);
  const issues = await checkAudio(lines);
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }
  console.log(`Audio en catalogi zijn in orde (${lines.length} spraakregels).`);
}

function updateLock(lock: AudioLock, line: SpeechLine): AudioLock {
  return {
    ...lock,
    entries: {
      ...lock.entries,
      [line.id]: { folder: line.folder, textHash: textHash(line) },
    },
  };
}

async function runGeneration(options: Options): Promise<void> {
  const lines = await selectedLines(options);
  let lock = await readLock();
  const todo = lines.filter((line) => needsAudio(line, lock, options.force));

  if (todo.length === 0) {
    console.log("Alles is al actueel.");
    return;
  }

  if (options.dryRun) {
    for (const line of todo) {
      console.log(`dry-run ${line.folder}/${line.id}: ${line.audioText ?? line.text}`);
    }
    console.log(`Klaar: ${todo.length} fragmenten zouden worden gegenereerd.`);
    return;
  }

  const config = readTtsConfig(NATHALIE_DEFAULTS);
  let generated = 0;
  for (const line of todo) {
    console.log(`genereer ${relativeAudioPath(line)}: ${line.audioText ?? line.text}`);
    const bytes = await requestSpeechMp3(config, line.audioText ?? line.text);
    if (!looksLikeMp3(bytes)) {
      throw new Error(`TTS gaf geen MP3 voor ${line.id} (${bytes.byteLength} bytes).`);
    }
    await writeAudioFile(line, bytes);
    lock = updateLock(lock, line);
    await writeLock(lock);
    generated += 1;
  }

  lock = { ...lock, model: config.model, voice: config.voice };
  await writeLock(lock);
  console.log(`Klaar: ${generated} fragmenten gegenereerd in apps/games/public/audio/nl.`);
}

async function main(): Promise<void> {
  const options = readOptions();
  if (options.help) {
    usage();
    return;
  }
  if (options.check) {
    await runCheck(options);
    return;
  }
  await runGeneration(options);
}

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Audio genereren is mislukt.");
  process.exit(1);
});
