/**
 * jsdom tekent geen canvas. Het bord roept alleen tekenmethodes aan; de pixels
 * zijn geen testseam. Deze stille context is genoeg om het bord te mounten.
 */
export function silentCanvasContext(): CanvasRenderingContext2D {
  const target: Record<string, unknown> = {
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    measureText: (text: string) => ({ width: String(text).length * 6 }),
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
  };
  return new Proxy(target, {
    get: (object, property: string) => (property in object ? object[property] : () => undefined),
    set: (object, property: string, value) => {
      object[property] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}
