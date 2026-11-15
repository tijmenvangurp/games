import type { AttributeValue, PersonId } from './types.ts'
import type { Board } from './Board.ts'
import type { Suspect } from './Suspect.ts'
import type { Victim } from './Victim.ts'
import type { Clue } from '../clues/Clue.ts'
import type { BoardClue } from '../clues/boardClues.ts'

/** A person on the board (suspect or victim) reduced to what the solver needs. */
export interface Person {
  readonly id: PersonId
  readonly name: string
  readonly clues: readonly Clue[]
  readonly isVictim: boolean
}

/** A full level: the board, the suspects, the victim, and any global clues. */
export class Puzzle {
  constructor(
    readonly id: string,
    readonly board: Board,
    readonly suspects: readonly Suspect[],
    readonly victim: Victim,
    readonly globalClues: readonly Clue[] = [],
    readonly boardClues: readonly BoardClue[] = [],
  ) {}

  /** Suspects followed by the victim. */
  people(): Person[] {
    const people: Person[] = this.suspects.map((s) => ({
      id: s.id,
      name: s.name,
      clues: s.clues,
      isVictim: false,
    }))
    people.push({
      id: this.victim.id,
      name: this.victim.name,
      clues: [],
      isVictim: true,
    })
    return people
  }

  nameOf(id: PersonId): string {
    if (id === this.victim.id) return this.victim.name
    const suspect = this.suspects.find((s) => s.id === id)
    return suspect ? suspect.name : id
  }

  /** All person ids: suspects followed by the victim. */
  allIds(): PersonId[] {
    return [...this.suspects.map((s) => s.id), this.victim.id]
  }

  attributesOf(id: PersonId): Readonly<Record<string, AttributeValue>> {
    if (id === this.victim.id) return this.victim.attributes
    return this.suspects.find((s) => s.id === id)?.attributes ?? {}
  }
}
