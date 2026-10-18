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
