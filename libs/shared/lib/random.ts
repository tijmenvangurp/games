/** Small, fast, deterministic PRNG for reproducible game scenes. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createSeed(): number {
  return Math.floor(Math.random() * 0xffff_ffff);
}

export function shuffledIndexes(total: number, random: () => number): number[] {
  const indexes = Array.from({ length: total }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = indexes[index];
    indexes[index] = indexes[swapWith];
    indexes[swapWith] = current;
  }
  return indexes;
}
