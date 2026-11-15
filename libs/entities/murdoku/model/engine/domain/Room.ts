/** A named, coloured region of the board. Tiles reference a room by id. */
export class Room {
  constructor(
    readonly id: string,
    readonly nameKey: string,
    readonly color: string,
    /** Outdoor area (pasture/yard/garden) vs indoor — used by inside/outside clues. */
    readonly outside: boolean = false,
  ) {}
}
