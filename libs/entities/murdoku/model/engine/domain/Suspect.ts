import type { AttributeValue, PersonId } from './types.ts'
import type { Clue } from '../clues/Clue.ts'

/** A suspect: an id ("A", "B", …), a display name, attributes, and clues. */
export class Suspect {
  constructor(
    readonly id: PersonId,
    readonly name: string,
    readonly attributes: Readonly<Record<string, AttributeValue>>,
    readonly clues: readonly Clue[],
  ) {}
}
