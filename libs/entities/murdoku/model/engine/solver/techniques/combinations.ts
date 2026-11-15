/** Yields every k-sized combination (as arrays) of the given items. */
export function* combinations<T>(items: readonly T[], k: number): Generator<T[]> {
  const n = items.length
  if (k < 0 || k > n) return
  const index = Array.from({ length: k }, (_, i) => i)
  while (true) {
    yield index.map((i) => items[i])
    let i = k - 1
    while (i >= 0 && index[i] === i + n - k) i--
    if (i < 0) return
    index[i]++
    for (let j = i + 1; j < k; j++) index[j] = index[j - 1] + 1
  }
}
