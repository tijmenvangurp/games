export interface FlipState {
  cards: readonly number[];
  matched: readonly boolean[];
  flipped: readonly number[];
  moves: number;
  locked: boolean;
  found: boolean;
}

export interface FlipOutcome {
  matched: boolean[];
  flipped: number[];
  moves: number;
  locked: boolean;
  found: boolean;
}

/** Applies one card tap. Returns null when the tap should be ignored. */
export function flipCard(state: FlipState, index: number): FlipOutcome | null {
  if (state.locked || state.found) {
    return null;
  }
  if (index < 0 || index >= state.cards.length) {
    return null;
  }
  if (state.matched[index] || state.flipped.includes(index)) {
    return null;
  }

  if (state.flipped.length === 0) {
    return {
      matched: [...state.matched],
      flipped: [index],
      moves: state.moves,
      locked: false,
      found: false,
    };
  }

  const first = state.flipped[0];
  const isMatch = state.cards[first] === state.cards[index];
  const matched = isMatch
    ? state.matched.map((value, at) => (at === first || at === index ? true : value))
    : [...state.matched];

  return {
    matched,
    flipped: isMatch ? [] : [first, index],
    moves: state.moves + 1,
    locked: !isMatch,
    found: matched.every(Boolean),
  };
}
