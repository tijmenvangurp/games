import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playHaptic, vibrate } from "@shared/lib";

const vibrateMock = vi.fn(() => true);

beforeEach(() => {
  vibrateMock.mockClear();
  Object.defineProperty(navigator, "vibrate", {
    configurable: true,
    value: vibrateMock,
  });
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "vibrate");
});

describe("haptics", () => {
  it("maps semantic names to coarse vibration patterns", () => {
    playHaptic("tap");
    expect(vibrateMock).toHaveBeenLastCalledWith(10);

    playHaptic("hint");
    expect(vibrateMock).toHaveBeenLastCalledWith(20);

    playHaptic("win");
    expect(vibrateMock).toHaveBeenLastCalledWith([20, 40, 20]);
  });

  it("passes custom patterns through", () => {
    vibrate([5, 10, 5]);
    expect(vibrateMock).toHaveBeenCalledWith([5, 10, 5]);
  });

  it("stays silent when the Vibration API is unavailable", () => {
    Reflect.deleteProperty(navigator, "vibrate");

    expect(() => playHaptic("tap")).not.toThrow();
    expect(() => vibrate(10)).not.toThrow();
  });

  it("never lets a broken vibration implementation break a game", () => {
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: () => {
        throw new Error("no motor");
      },
    });

    expect(() => playHaptic("win")).not.toThrow();
  });
});
