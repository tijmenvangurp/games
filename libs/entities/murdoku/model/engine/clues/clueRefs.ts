import type { Clue } from "./Clue.ts";
import { AndClue, OrClue, NotClue } from "./compositeClues.ts";
import {
  RoomAttributeClue,
  RoomCompanionClue,
  RoomExistsClue,
  AloneWithClue,
} from "./socialClues.ts";
import {
  DirectionClue,
  OffsetClue,
  SameRoomClue,
  InsideXorClue,
  DirectionFromAttrClue,
} from "./relationalClues.ts";
import { BesideSameObjectClue } from "./objectClues.ts";
import type { AttributeValue, PersonId } from "../domain/types.ts";
import type { Puzzle } from "../domain/Puzzle.ts";

/** The traits and named people a clue points at — used to highlight the OTHER suspects a
 *  selected suspect's clue is "about" (everyone sharing a mentioned trait, plus any named
 *  person). Reading-only: it never reveals positions, just groups by visible appearance. */
interface ClueRefs {
  traits: { attribute: string; value: AttributeValue }[];
  persons: PersonId[];
}

function collect(clue: Clue, into: ClueRefs): void {
  if (clue instanceof AndClue || clue instanceof OrClue) {
    for (const c of clue.clues) collect(c, into);
    return;
  }
  if (clue instanceof NotClue) {
    collect(clue.inner, into);
    return;
  }
  if (
    clue instanceof RoomAttributeClue ||
    clue instanceof RoomCompanionClue ||
    clue instanceof DirectionFromAttrClue
  ) {
    into.traits.push({ attribute: clue.attribute, value: clue.value });
    return;
  }
  if (clue instanceof AloneWithClue) {
    into.traits.push({ attribute: clue.attribute, value: clue.value });
    into.persons.push(...clue.people);
    return;
  }
  if (clue instanceof RoomExistsClue) {
    if (clue.person) into.persons.push(clue.person);
    else if (clue.attribute) into.traits.push({ attribute: clue.attribute, value: clue.value });
    return;
  }
  if (clue instanceof BesideSameObjectClue) {
    if (clue.mate.kind === "person") into.persons.push(clue.mate.of);
    else if (clue.mate.kind === "attr") {
      into.traits.push({ attribute: clue.mate.attribute, value: clue.mate.value });
    }
    return;
  }
  if (
    clue instanceof DirectionClue ||
    clue instanceof OffsetClue ||
    clue instanceof SameRoomClue ||
    clue instanceof InsideXorClue
  ) {
    into.persons.push(clue.target);
  }
}

/**
 * The OTHER suspects a suspect's clues refer to: every (other) suspect sharing a trait the
 * clues mention, plus any named suspect. Excludes the suspect themselves and the victim.
 * Drives the "select a suspect → matching cards pulse" highlight.
 */
export function relatedSuspects(
  clues: readonly Clue[],
  selfId: PersonId,
  puzzle: Puzzle,
): Set<PersonId> {
  const refs: ClueRefs = { traits: [], persons: [] };
  for (const c of clues) collect(c, refs);

  const out = new Set<PersonId>();
  const victim = puzzle.victim.id;
  for (const p of refs.persons) if (p !== selfId && p !== victim) out.add(p);
  if (refs.traits.length > 0) {
    for (const s of puzzle.suspects) {
      if (s.id === selfId) continue;
      const attrs = puzzle.attributesOf(s.id);
      if (refs.traits.some((t) => attrs[t.attribute] === t.value)) out.add(s.id);
    }
  }
  return out;
}
