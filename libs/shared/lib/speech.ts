import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Eén spraakregel uit een audiocatalogus. De folder en id bepalen samen het
 * lokale bestand: `/audio/nl/<folder>/<id>.mp3`.
 */
export interface SpeechLine {
  readonly folder: string;
  readonly id: string;
  readonly text: string;
  /** Wat TTS zegt als dat afwijkt van de zichtbare tekst. */
  readonly audioText?: string;
}

export interface SpeechGroup {
  readonly folder: string;
  readonly lines: readonly SpeechLine[];
}

const STORAGE_KEY = "games.speech.v1";

function readEnabled(): boolean {
  try {
    if (typeof localStorage === "undefined") {
      return true;
    }
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

let enabled = readEnabled();
let element: HTMLAudioElement | null = null;
let queue: SpeechLine[] = [];
let token = 0;
let resolveQueue: (() => void) | null = null;
const listeners = new Set<() => void>();

let gestureSeen = typeof document === "undefined";

if (typeof document !== "undefined") {
  const markGesture = () => {
    gestureSeen = true;
    document.removeEventListener("pointerdown", markGesture, true);
    document.removeEventListener("keydown", markGesture, true);
  };
  document.addEventListener("pointerdown", markGesture, true);
  document.addEventListener("keydown", markGesture, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopSpeech();
    }
  });
}

export function isSpeechEnabled(): boolean {
  return enabled;
}

export function setSpeechEnabled(next: boolean): void {
  if (enabled === next) {
    return;
  }
  enabled = next;
  if (!enabled) {
    stopSpeech();
  }
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Storage may be unavailable; the in-memory setting still works.
  }
  for (const listener of listeners) {
    listener();
  }
}

export function toggleSpeech(): boolean {
  setSpeechEnabled(!enabled);
  return enabled;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSpeechEnabled(): boolean {
  return useSyncExternalStore(subscribe, isSpeechEnabled, isSpeechEnabled);
}

/** Het pad van een spraakregel. De generator schrijft precies dit pad. */
export function audioSrc(line: Pick<SpeechLine, "folder" | "id">): string {
  return `/audio/nl/${line.folder}/${line.id}.mp3`;
}

function finishQueue(): void {
  const resolve = resolveQueue;
  resolveQueue = null;
  resolve?.();
}

function cancelQueue(): void {
  token += 1;
  queue = [];
  if (element) {
    element.onended = null;
    element.onerror = null;
    element.pause();
    element.removeAttribute("src");
  }
  finishQueue();
}

function playNext(currentToken: number): void {
  if (currentToken !== token) {
    return;
  }

  const next = queue.shift();
  if (!next) {
    finishQueue();
    return;
  }

  try {
    if (!element) {
      element = new Audio();
      element.preload = "none";
    }
    const audio = element;
    audio.onended = () => playNext(currentToken);
    audio.onerror = () => playNext(currentToken);
    audio.src = audioSrc(next);
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay or codec failure: skip this clip and keep the game usable.
      playNext(currentToken);
    });
  } catch {
    // Audio is a bonus, never a requirement for play.
    playNext(currentToken);
  }
}

/**
 * Speelt één regel of een reeks regels na elkaar. Een nieuwe aanroep stopt de
 * vorige reeks. De promise resolvet ook als voorlezen uit staat of audio
 * ontbreekt, zodat de aanroeper nooit hoeft te wachten op iets dat niet komt.
 */
export function speak(lines: SpeechLine | readonly SpeechLine[]): Promise<void> {
  if (!enabled) {
    return Promise.resolve();
  }

  const items = Array.isArray(lines) ? [...lines] : [lines as SpeechLine];
  if (items.length === 0) {
    return Promise.resolve();
  }

  cancelQueue();
  const currentToken = token;
  queue = items;

  return new Promise((resolve) => {
    resolveQueue = resolve;
    playNext(currentToken);
  });
}

export function stopSpeech(): void {
  cancelQueue();
}

/**
 * Leest automatisch voor wanneer `key` verandert, maar pas nadat het kind één
 * keer heeft getikt of een toets heeft gebruikt. Zo blijft autoplay voorspelbaar
 * en werken de knoppen altijd als fallback.
 */
export function useAutoSpeech(
  key: string,
  lines: SpeechLine | readonly SpeechLine[] | null | undefined,
): void {
  const enabled = useSpeechEnabled();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !gestureSeen || !lines) {
      return;
    }
    if (Array.isArray(lines) && lines.length === 0) {
      return;
    }
    if (lastKey.current === key) {
      return;
    }
    lastKey.current = key;
    void speak(lines);
  }, [enabled, key, lines]);
}
