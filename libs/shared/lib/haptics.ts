/**
 * Semantic haptic feedback for game actions. The Vibration API is native and
 * available in Chromium-based browsers on Android; on iOS/iPadOS Safari and
 * desktop browsers without a motor the call is a silent no-op.
 *
 * Keep patterns coarse: some Android devices clip very short pulses, and no
 * web API exposes intensity or a waveform. Any buzz should simply mean
 * "something happened".
 */
export type HapticName = "tap" | "select" | "match" | "wrong" | "hint" | "almost" | "win";

const HAPTIC_PATTERNS: Record<HapticName, number | number[]> = {
  tap: 10,
  select: 10,
  match: [10, 30, 10],
  wrong: [30, 40, 30],
  hint: 20,
  almost: 20,
  win: [20, 40, 20],
};

/**
 * Small tactile confirmation on devices that support vibration. Unsupported
 * browsers and desktop devices simply ignore it.
 */
export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // Haptics are a bonus, never a requirement for play.
  }
}

/** Plays a named haptic pattern; mirrors the names used by `playSound`. */
export function playHaptic(name: HapticName): void {
  vibrate(HAPTIC_PATTERNS[name]);
}
