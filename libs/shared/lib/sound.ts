import { useSyncExternalStore } from "react";

type SoundName = "tap" | "select" | "match" | "wrong" | "hint" | "almost" | "win";

interface Tone {
  frequency: number;
  delay: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const STORAGE_KEY = "games.sound.v1";

const SOUND_PATTERNS: Record<SoundName, readonly Tone[]> = {
  tap: [{ frequency: 660, delay: 0, duration: 0.05, type: "sine", volume: 0.04 }],
  select: [{ frequency: 740, delay: 0, duration: 0.06, type: "sine", volume: 0.05 }],
  match: [
    { frequency: 659, delay: 0, duration: 0.08, type: "sine", volume: 0.05 },
    { frequency: 880, delay: 0.07, duration: 0.1, type: "sine", volume: 0.05 },
  ],
  wrong: [{ frequency: 220, delay: 0, duration: 0.16, type: "square", volume: 0.035 }],
  hint: [{ frequency: 880, delay: 0, duration: 0.1, type: "triangle", volume: 0.045 }],
  almost: [
    { frequency: 659, delay: 0, duration: 0.08, type: "sine", volume: 0.045 },
    { frequency: 988, delay: 0.08, duration: 0.14, type: "sine", volume: 0.045 },
  ],
  win: [
    { frequency: 523, delay: 0, duration: 0.1, type: "sine", volume: 0.05 },
    { frequency: 659, delay: 0.1, duration: 0.1, type: "sine", volume: 0.05 },
    { frequency: 784, delay: 0.2, duration: 0.18, type: "sine", volume: 0.05 },
  ],
};

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
let audioContext: AudioContext | null = null;
const listeners = new Set<() => void>();

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(next: boolean): void {
  if (enabled === next) {
    return;
  }
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Storage may be unavailable; the in-memory setting still works.
  }
  for (const listener of listeners) {
    listener();
  }
}

export function toggleSound(): boolean {
  setSoundEnabled(!enabled);
  return enabled;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, isSoundEnabled, isSoundEnabled);
}

function scheduleTone(audio: AudioContext, note: Tone, now: number): void {
  const start = now + note.delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = note.type;
  oscillator.frequency.setValueAtTime(note.frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(note.volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);

  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + note.duration + 0.02);
}

/**
 * Plays a tiny synthesized sound. This stays inside the strict CSP because it
 * uses the Web Audio API without fetching files. Audio is optional: browsers
 * without Web Audio, an autoplay block or a closed context never break a game.
 */
export function playSound(name: SoundName): void {
  if (!enabled) {
    return;
  }

  try {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextConstructor();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => {
        // The next user gesture will try again.
      });
    }

    const now = audioContext.currentTime;
    for (const note of SOUND_PATTERNS[name]) {
      scheduleTone(audioContext, note, now);
    }
  } catch {
    // Sound is a bonus, never a requirement for play.
  }
}
