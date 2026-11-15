/**
 * Water rooms — a lake / sea / ocean area. They are drawn as a WATER surface with grassy
 * banks (see the board renderer) and furnished by the `lake` archetype, but mechanically
 * a water room is a perfectly NORMAL room: its empty floor is occupiable, so a person can
 * stand in the water just like on any floor (the legend states this as a global rule).
 *
 * This is the single source of truth shared by the generator (furnishing → archetype),
 * the board renderer (water look) and the legend (the "walkable" hint). `pond` is left
 * OUT on purpose — it stays a green garden, not open water.
 */
// moat (castle) and the two swimming pools (lido) count as water too — they get the
// water look and (except the pools, which use the sparse 'pool' recipe) lake furnishing.
const WATER_ROOM_KEYS: ReadonlySet<string> = new Set([
  'lake',
  'jetty',
  'sea',
  'ocean',
  'lagoon',
  'moat',
  'mainpool',
  'kidspool',
])

/** True when a room's nameKey (with or without the `room.` prefix) names a body of water. */
export function isWaterRoom(nameKey: string): boolean {
  const key = nameKey.replace(/^room\./, '').toLowerCase()
  return WATER_ROOM_KEYS.has(key) || /lake|ocean|lagoon|sea/.test(key)
}
