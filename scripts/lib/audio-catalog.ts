import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import type { SpeechGroup, SpeechLine } from "../../libs/shared/lib/speech.ts";
import { looksLikeMp3 } from "./tts.ts";

const AUDIO_ROOT = join("apps", "games", "public", "audio", "nl");
const LOCK_PATH = join("scripts", "audio.lock.json");

export interface AudioLockEntry {
  readonly folder: string;
  readonly textHash: string;
}

export interface AudioLock {
  readonly version: 1;
  readonly model?: string;
  readonly voice?: string;
  readonly entries: Record<string, AudioLockEntry>;
}

export interface LoadedSpeechGroup {
  readonly file: string;
  readonly group: SpeechGroup;
}

export interface AudioIssue {
  readonly path: string;
  readonly message: string;
}

function emptyLock(): AudioLock {
  return { version: 1, entries: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSpeechLine(value: unknown, folder: string, file: string): value is SpeechLine {
  if (!isRecord(value)) {
    throw new Error(`${file}: spraakregel is geen object.`);
  }
  if (value.folder !== folder) {
    throw new Error(`${file}: spraakregel ${String(value.id)} heeft de verkeerde folder.`);
  }
  if (typeof value.id !== "string" || value.id.trim().length === 0) {
    throw new Error(`${file}: spraakregel heeft geen id.`);
  }
  if (typeof value.text !== "string" || value.text.trim().length === 0) {
    throw new Error(`${file}: spraakregel ${value.id} heeft geen tekst.`);
  }
  if (value.audioText !== undefined && typeof value.audioText !== "string") {
    throw new Error(`${file}: audioText van ${value.id} is geen string.`);
  }
  return true;
}

function isSpeechGroup(value: unknown, file: string): value is SpeechGroup {
  if (!isRecord(value)) {
    throw new Error(`${file}: speechGroup is geen object.`);
  }
  if (typeof value.folder !== "string" || value.folder.trim().length === 0) {
    throw new Error(`${file}: speechGroup heeft geen folder.`);
  }
  if (!Array.isArray(value.lines)) {
    throw new Error(`${file}: speechGroup ${value.folder} heeft geen lines.`);
  }
  for (const line of value.lines) {
    isSpeechLine(line, value.folder, file);
  }
  return true;
}

async function findAudioFiles(directory: string, result: string[] = []): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await findAudioFiles(fullPath, result);
      continue;
    }
    if (entry.isFile() && entry.name === "audio.ts" && fullPath.includes(`${sep}model${sep}`)) {
      result.push(fullPath);
    }
  }
  return result;
}

/**
 * Elke game of elk domein dat spraak heeft, heeft een `model/audio.ts` met
 * `speechGroups`. De generator ontdekt die bestanden zelf; er is geen centrale
 * lijst die handmatig bijgehouden moet worden.
 */
export async function loadSpeechGroups(): Promise<readonly LoadedSpeechGroup[]> {
  const files = await findAudioFiles("libs");
  const groups: LoadedSpeechGroup[] = [];
  const seenIds = new Map<string, string>();

  for (const file of files) {
    const module = (await import(pathToFileURL(file).href)) as {
      speechGroups?: unknown;
      speechGroup?: unknown;
    };
    const rawGroups = module.speechGroups
      ? module.speechGroups
      : module.speechGroup
        ? [module.speechGroup]
        : null;

    if (rawGroups === null) {
      continue;
    }
    if (!Array.isArray(rawGroups)) {
      throw new Error(`${file}: speechGroups moet een array zijn.`);
    }

    for (const rawGroup of rawGroups) {
      if (!isSpeechGroup(rawGroup, file)) {
        continue;
      }
      for (const line of rawGroup.lines) {
        const existing = seenIds.get(line.id);
        if (existing) {
          throw new Error(`${file}: dubbele spraak-id "${line.id}" (ook in ${existing}).`);
        }
        seenIds.set(line.id, file);
      }
      groups.push({ file, group: rawGroup });
    }
  }

  return groups;
}

export function flattenSpeechLines(groups: readonly LoadedSpeechGroup[]): readonly SpeechLine[] {
  return groups.flatMap(({ group }) => group.lines);
}

export function audioFileFor(line: Pick<SpeechLine, "folder" | "id">): string {
  return join(AUDIO_ROOT, line.folder, `${line.id}.mp3`);
}

export function textHash(line: Pick<SpeechLine, "text" | "audioText">): string {
  const input = line.audioText ?? line.text;
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export async function readLock(): Promise<AudioLock> {
  try {
    const raw = JSON.parse(await readFile(LOCK_PATH, "utf8")) as unknown;
    if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.entries)) {
      return emptyLock();
    }
    return raw as unknown as AudioLock;
  } catch {
    return emptyLock();
  }
}

export async function writeLock(lock: AudioLock): Promise<void> {
  await writeFile(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
}

export async function checkAudio(lines: readonly SpeechLine[]): Promise<readonly AudioIssue[]> {
  const lock = await readLock();
  const issues: AudioIssue[] = [];

  for (const line of lines) {
    const path = audioFileFor(line);
    const entry = lock.entries[line.id];
    if (!entry) {
      issues.push({ path, message: "Ontbreekt in audio.lock.json." });
      continue;
    }
    if (entry.folder !== line.folder) {
      issues.push({ path, message: `Lock-folder is "${entry.folder}".` });
      continue;
    }
    if (entry.textHash !== textHash(line)) {
      issues.push({ path, message: "Tekst is gewijzigd; genereer de audio opnieuw." });
      continue;
    }

    try {
      const bytes = await readFile(path);
      if (bytes.byteLength === 0) {
        issues.push({ path, message: "Audiobestand is leeg." });
      } else if (!looksLikeMp3(bytes)) {
        issues.push({ path, message: "Bestand is geen MP3." });
      }
    } catch {
      issues.push({ path, message: "Audiobestand ontbreekt." });
    }
  }

  return issues;
}

export function needsAudio(line: SpeechLine, lock: AudioLock, force: boolean): boolean {
  if (force) {
    return true;
  }
  const entry = lock.entries[line.id];
  return !entry || entry.folder !== line.folder || entry.textHash !== textHash(line);
}

export function relativeAudioPath(line: Pick<SpeechLine, "folder" | "id">): string {
  return relative(process.cwd(), audioFileFor(line));
}

export async function writeAudioFile(line: SpeechLine, bytes: Uint8Array): Promise<void> {
  await mkdir(dirname(audioFileFor(line)), { recursive: true });
  await writeFile(audioFileFor(line), bytes);
}
