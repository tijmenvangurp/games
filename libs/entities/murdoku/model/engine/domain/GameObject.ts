/**
 * An object that can sit on a tile (bed, chair, carpet, table, window, …).
 * `occupiable` says whether a person may stand on this object.
 */
export class GameObject {
  constructor(
    readonly type: string,
    readonly occupiable: boolean,
  ) {}
}
