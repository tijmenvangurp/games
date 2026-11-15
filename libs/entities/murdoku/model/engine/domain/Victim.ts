import { VICTIM_ID } from './types.ts'
import type { AttributeValue, PersonId } from './types.ts'

/** The victim: placed like any person, but carries no clues. */
export class Victim {
  readonly id: PersonId = VICTIM_ID

  constructor(
    readonly name: string,
    readonly attributes: Readonly<Record<string, AttributeValue>> = {},
  ) {}
}
