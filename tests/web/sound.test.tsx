import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isSoundEnabled,
  playSound,
  setSoundEnabled,
  toggleSound,
  useSoundEnabled,
} from "@shared/lib";
import { SoundToggle } from "@shared/ui";

const STORAGE_KEY = "games.sound.v1";

class FakeParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeNode {
  type = "sine";
  frequency = new FakeParam();
  gain = new FakeParam();
  connect = vi.fn(() => this);
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  state: AudioContextState = "running";
  currentTime = 0;
  destination = {};
  oscillators: FakeNode[] = [];
  gains: FakeNode[] = [];
  resume = vi.fn(() => Promise.resolve());

  createOscillator = vi.fn(() => {
    const node = new FakeNode();
    this.oscillators.push(node);
    return node;
  });

  createGain = vi.fn(() => {
    const node = new FakeNode();
    this.gains.push(node);
    return node;
  });

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  setSoundEnabled(true);
  FakeAudioContext.instances = [];
});

afterEach(() => {
  cleanup();
  // @ts-expect-error remove the test double again
  delete window.AudioContext;
});

describe("sound", () => {
  it("starts enabled and persists the toggle", () => {
    expect(isSoundEnabled()).toBe(true);

    expect(toggleSound()).toBe(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("off");

    expect(toggleSound()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("on");
  });

  it("updates the hook when the setting changes", () => {
    const { result } = renderHook(() => useSoundEnabled());
    expect(result.current).toBe(true);

    act(() => {
      toggleSound();
    });
    expect(result.current).toBe(false);
  });

  it("renders an accessible sound toggle", () => {
    render(<SoundToggle />);

    const button = screen.getByRole("button", { name: "Geluid uitzetten" });
    expect(button.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Geluid aanzetten" })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("off");
  });

  it("does nothing when Web Audio is unavailable", () => {
    expect(() => playSound("win")).not.toThrow();
  });

  it("does not create a context while muted", () => {
    setSoundEnabled(false);
    playSound("tap");
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("schedules tones and recovers a closed or suspended context", () => {
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: FakeAudioContext,
    });

    playSound("win");
    const first = FakeAudioContext.instances[0];
    if (!first) {
      throw new Error("No audio context created");
    }
    expect(first.oscillators).toHaveLength(3);
    expect(first.oscillators[0]?.start).toHaveBeenCalled();
    expect(first.oscillators[0]?.stop).toHaveBeenCalled();

    first.state = "closed";
    playSound("tap");
    expect(FakeAudioContext.instances).toHaveLength(2);

    const second = FakeAudioContext.instances[1];
    if (!second) {
      throw new Error("No second audio context created");
    }
    second.state = "suspended";
    playSound("hint");
    expect(second.resume).toHaveBeenCalled();
  });
});
