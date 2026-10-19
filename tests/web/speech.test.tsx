import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  audioSrc,
  isSpeechEnabled,
  setSpeechEnabled,
  speak,
  stopSpeech,
  toggleSpeech,
  useAutoSpeech,
  useSpeechEnabled,
  type SpeechLine,
} from "@shared/lib";
import { SpeechButton, SpeechToggle, SpokenText } from "@shared/ui";

const STORAGE_KEY = "games.speech.v1";

class FakeAudio {
  static instances: FakeAudio[] = [];

  src = "";
  currentTime = 0;
  preload = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  removeAttribute = vi.fn((name: string) => {
    if (name === "src") {
      this.src = "";
    }
  });

  constructor() {
    FakeAudio.instances.push(this);
  }

  finish(): void {
    this.onended?.();
  }
}

const LINE: SpeechLine = {
  folder: "math",
  id: "math-number-5",
  text: "vijf",
};

const OTHER: SpeechLine = {
  folder: "math",
  id: "math-number-6",
  text: "zes",
};

beforeEach(() => {
  vi.stubGlobal("Audio", FakeAudio);
  cleanup();
  localStorage.clear();
  setSpeechEnabled(true);
  stopSpeech();
  const audio = FakeAudio.instances[0];
  if (audio) {
    audio.play.mockClear();
    audio.pause.mockClear();
    audio.removeAttribute.mockClear();
    audio.src = "";
    audio.onended = null;
    audio.onerror = null;
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("speech", () => {
  it("bouwt lokale paden", () => {
    expect(audioSrc(LINE)).toBe("/audio/nl/math/math-number-5.mp3");
  });

  it("start aan en bewaart de voorkeur", () => {
    expect(isSpeechEnabled()).toBe(true);
    expect(toggleSpeech()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("off");
    expect(toggleSpeech()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("on");
  });

  it("werkt met de hook en de toggle", () => {
    const { result } = renderHook(() => useSpeechEnabled());
    expect(result.current).toBe(true);

    render(<SpeechToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Voorlezen uitzetten" }));
    expect(result.current).toBe(false);
    expect(screen.getByRole("button", { name: "Voorlezen aanzetten" })).toBeTruthy();
  });

  it("speelt één clip en lost daarna op", async () => {
    const promise = speak(LINE);
    const audio = FakeAudio.instances[0];
    if (!audio) {
      throw new Error("Geen audio-element");
    }
    expect(audio.src).toBe("/audio/nl/math/math-number-5.mp3");
    expect(audio.play).toHaveBeenCalled();

    audio.finish();
    await expect(promise).resolves.toBeUndefined();
  });

  it("speelt een reeks na elkaar", async () => {
    const promise = speak([LINE, OTHER]);
    const audio = FakeAudio.instances[0];
    if (!audio) {
      throw new Error("Geen audio-element");
    }
    expect(audio.src).toBe("/audio/nl/math/math-number-5.mp3");

    audio.finish();
    await Promise.resolve();
    expect(audio.src).toBe("/audio/nl/math/math-number-6.mp3");

    audio.finish();
    await expect(promise).resolves.toBeUndefined();
  });

  it("stopt de wachtrij en doet niets als voorlezen uit staat", async () => {
    const first = speak([LINE, OTHER]);
    stopSpeech();
    await expect(first).resolves.toBeUndefined();

    setSpeechEnabled(false);
    const audio = FakeAudio.instances[0];
    audio?.play.mockClear();
    await expect(speak(LINE)).resolves.toBeUndefined();
    expect(audio?.play).not.toHaveBeenCalled();
  });

  it("rendert een sprekerknop die de regel speelt", () => {
    render(<SpeechButton label="Beluister vijf" line={LINE} />);
    fireEvent.click(screen.getByRole("button", { name: "Beluister vijf" }));

    const audio = FakeAudio.instances[0];
    expect(audio?.src).toBe("/audio/nl/math/math-number-5.mp3");
  });

  it("rendert tekst en een sprekerknop", () => {
    render(<SpokenText label="Beluister de uitleg" line={LINE} />);
    expect(screen.getByText("vijf")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Beluister de uitleg" })).toBeTruthy();
  });

  it("leest automatisch voor na een tik en alleen bij een nieuwe sleutel", async () => {
    fireEvent.pointerDown(document);

    function Auto({ line, id }: { line: SpeechLine; id: string }) {
      useAutoSpeech(id, line);
      return null;
    }

    const { rerender } = render(<Auto id="first" line={LINE} />);
    const audio = FakeAudio.instances[0];
    if (!audio) {
      throw new Error("Geen audio-element");
    }
    expect(audio.src).toBe("/audio/nl/math/math-number-5.mp3");
    audio.play.mockClear();

    rerender(<Auto id="first" line={LINE} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(audio.play).not.toHaveBeenCalled();

    rerender(<Auto id="second" line={OTHER} />);
    expect(audio.src).toBe("/audio/nl/math/math-number-6.mp3");
  });
});
