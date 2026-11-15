import {
  VICTIM_ID,
  findMurdokuMurderer,
  validateMurdokuPlacement,
  type Cell,
  type PersonId,
  type Puzzle,
} from "@entities/murdoku";

/** De twee tikstanden van het bord: iemand plaatsen of een vakje wegstrepen. */
export type MurdokuMode = "place" | "cross";

/** De fase van één zaak: spelen of opgelost. */
export type MurdokuPhase = "playing" | "solved";

/** De afloop van een opgeloste zaak, zoals het bord en de pagina die tonen. */
export interface MurdokuResolution {
  /** De enige verdachte in de kamer van het slachtoffer. */
  murdererId: PersonId;
  /** Het vaste vakje van het slachtoffer; bij de afloop onthuld. */
  victimCell: Cell;
  /** De kamer van het slachtoffer; het bord omlijnt die. */
  roomId: string;
}

/**
 * De speltoestand van één zaak. Alles wat het bord tekent is hieruit af te
 * leiden: plaatsingen, handmatige kruisjes, de keuze en de tikstand. Auto-kruis
 * wordt bewust niet opgeslagen maar uit de plaatsingen berekend, zodat een
 * verplaatst of verwijderd persoon nooit een spookkruisje achterlaat.
 */
export interface MurdokuPlayState {
  levelId: string;
  placements: ReadonlyMap<PersonId, Cell>;
  manualCrosses: ReadonlySet<Cell>;
  selected: PersonId | null;
  mode: MurdokuMode;
  /** `solved` zodra een controle klopte; het bord staat dan vast. */
  phase: MurdokuPhase;
  /** De laatste controle klopte niet. Neutraal: geen straf en geen foutkleur. */
  wrongCheck: boolean;
  /** De onthulling na een goede controle. */
  resolution: MurdokuResolution | null;
}

/** Een leeg bord voor een zaak. */
export function createMurdokuPlay(levelId: string): MurdokuPlayState {
  return {
    levelId,
    placements: new Map(),
    manualCrosses: new Set(),
    selected: null,
    mode: "place",
    phase: "playing",
    wrongCheck: false,
    resolution: null,
  };
}

/** Of alle verdachten van de zaak op het bord staan; het slachtoffer volgt bij de afloop. */
export function everyonePlaced(puzzle: Puzzle, play: MurdokuPlayState): boolean {
  return puzzle.suspects.every((suspect) => play.placements.has(suspect.id));
}

/** Een opgelost bord staat vast: tikken, kruisen en ongedaan maken doen niets meer. */
function isLocked(play: MurdokuPlayState): boolean {
  return play.phase === "solved";
}

/** De persoon op een vakje, of `null`. */
function personAt(play: MurdokuPlayState, cell: Cell): PersonId | null {
  for (const [person, placed] of play.placements) {
    if (placed === cell) return person;
  }
  return null;
}

/**
 * De vakjes die automatisch zijn weggestreept: de hele rij en kolom van elke
 * geplaatste persoon. Alleen bezetbare, nog lege vakjes tellen mee; een
 * geplaatst persoon krijgt dus nooit een kruisje op zijn eigen vakje.
 */
function autoCrosses(puzzle: Puzzle, play: MurdokuPlayState): Set<Cell> {
  const { board } = puzzle;
  const occupied = new Set(play.placements.values());
  const crossed = new Set<Cell>();

  for (const cell of play.placements.values()) {
    const { row, col } = board.rc(cell);
    for (let c = 0; c < board.width; c++) {
      const candidate = board.idx(row, c);
      if (board.isOccupiable(candidate) && !occupied.has(candidate)) crossed.add(candidate);
    }
    for (let r = 0; r < board.height; r++) {
      const candidate = board.idx(r, col);
      if (board.isOccupiable(candidate) && !occupied.has(candidate)) crossed.add(candidate);
    }
  }

  return crossed;
}

/** Alle zichtbare kruisjes: handmatig gezet plus automatisch afgeleid. */
export function crossedCells(puzzle: Puzzle, play: MurdokuPlayState): Set<Cell> {
  return new Set([...play.manualCrosses, ...autoCrosses(puzzle, play)]);
}

/**
 * De vakjes waar de gekozen persoon nu mag staan, of `null` als er niemand
 * gekozen is of de kruisjesstand aanstaat. Het eigen vakje blijft zichtbaar,
 * zodat een kind de persoon kan verplaatsen of weghalen.
 */
export function candidateCells(puzzle: Puzzle, play: MurdokuPlayState): Set<Cell> | null {
  if (play.mode !== "place" || !play.selected) return null;
  const ownCell = play.placements.get(play.selected);
  const occupied = new Set(play.placements.values());
  return new Set(
    puzzle.board.occupiableCells().filter((cell) => !occupied.has(cell) || cell === ownCell),
  );
}

/**
 * Kiest een persoon, of heft de keuze op als hij al gekozen is. Een keuze zet de
 * tikstand terug naar plaatsen: wie een persoon aanraakt, wil hem kwijt kunnen.
 */
export function selectPerson(play: MurdokuPlayState, person: PersonId): MurdokuPlayState {
  if (isLocked(play)) return play;
  if (play.selected === person) {
    return { ...play, selected: null, wrongCheck: false };
  }
  return { ...play, selected: person, mode: "place", wrongCheck: false };
}

/** Wisselt tussen plaatsen en kruisjes zetten. */
export function setMurdokuMode(play: MurdokuPlayState, mode: MurdokuMode): MurdokuPlayState {
  if (isLocked(play)) return play;
  const selected = mode === "cross" ? null : play.selected;
  return { ...play, mode, selected, wrongCheck: false };
}

/**
 * Eén tik op een vakje in de plaatsstand:
 * - de gekozen persoon staat er al: haal hem weg;
 * - er staat iemand anders: vervang die persoon;
 * - anders: zet de gekozen persoon er neer (en verplaats hem als hij al stond).
 * Een niet-bezetbaar vakje of een tik zonder keuze verandert niets.
 */
function tapPlacementCell(puzzle: Puzzle, play: MurdokuPlayState, cell: Cell): MurdokuPlayState {
  if (!play.selected || !puzzle.board.isOccupiable(cell)) {
    return play;
  }

  const selected = play.selected;
  const current = personAt(play, cell);
  if (current === selected) {
    const placements = new Map(play.placements);
    placements.delete(selected);
    return { ...play, placements };
  }

  const placements = new Map(play.placements);
  if (current) {
    placements.delete(current);
  }
  placements.set(selected, cell);
  const manualCrosses = new Set(play.manualCrosses);
  manualCrosses.delete(cell);
  return { ...play, placements, manualCrosses };
}

/**
 * Eén tik in de kruisjesstand. Een kruisje kan alleen op een bezetbaar vakje
 * zonder persoon; een automatisch kruisje is niet met de hand weg te halen
 * zolang die persoon er staat.
 */
function tapCrossCell(puzzle: Puzzle, play: MurdokuPlayState, cell: Cell): MurdokuPlayState {
  if (
    !puzzle.board.isOccupiable(cell) ||
    personAt(play, cell) ||
    autoCrosses(puzzle, play).has(cell)
  ) {
    return play;
  }

  const manualCrosses = new Set(play.manualCrosses);
  if (manualCrosses.has(cell)) {
    manualCrosses.delete(cell);
  } else {
    manualCrosses.add(cell);
  }
  return { ...play, manualCrosses };
}

/** Eén tik op een vakje, in de stand die nu gekozen is. */
export function tapMurdokuCell(
  puzzle: Puzzle,
  play: MurdokuPlayState,
  cell: Cell,
): MurdokuPlayState {
  if (isLocked(play)) return play;
  const next =
    play.mode === "cross" ? tapCrossCell(puzzle, play, cell) : tapPlacementCell(puzzle, play, cell);
  if (next === play) return play;
  return { ...next, wrongCheck: false };
}

/**
 * Of een volledige plaatsing de bordregel volgt: één persoon per rij en per
 * kolom. De engine bewaakt die regel in de solver, maar niet in de losse
 * aanwijzingen, dus de controle toetst hem hier zelf.
 */
function onePersonEachLine(puzzle: Puzzle, placement: ReadonlyMap<PersonId, Cell>): boolean {
  const rows = new Set<number>();
  const cols = new Set<number>();
  for (const cell of placement.values()) {
    const { row, col } = puzzle.board.rc(cell);
    if (rows.has(row) || cols.has(col)) return false;
    rows.add(row);
    cols.add(col);
  }
  return true;
}

/**
 * Controleert de zaak. Pas als alle verdachten staan, anders gebeurt er niets.
 *
 * Het slachtoffer heeft een vast vakje in de zaak; de controle plaatst het
 * slachtoffer uit de oplossing en toetst daarna alle aanwijzingen, de
 * bordregel en de daderregel. Bij een fout blijft het bord staan en komt er
 * alleen neutrale feedback. Bij een goede controle komt het slachtoffer op het
 * bord, staan de plaatsingen vast en is de dader bekend.
 */
export function checkMurdokuPlay(
  puzzle: Puzzle,
  play: MurdokuPlayState,
  solution: ReadonlyMap<PersonId, Cell>,
): MurdokuPlayState {
  if (isLocked(play) || !everyonePlaced(puzzle, play)) return play;

  const victimCell = solution.get(VICTIM_ID);
  if (victimCell === undefined) return play;

  const placements = new Map(play.placements);
  placements.set(VICTIM_ID, victimCell);
  const murderer = findMurdokuMurderer(puzzle, placements);

  if (
    validateMurdokuPlacement(puzzle, placements).length > 0 ||
    !onePersonEachLine(puzzle, placements) ||
    !murderer.suspectId
  ) {
    return { ...play, wrongCheck: true };
  }

  const manualCrosses = new Set(play.manualCrosses);
  manualCrosses.delete(victimCell);

  return {
    ...play,
    placements,
    manualCrosses,
    selected: null,
    phase: "solved",
    wrongCheck: false,
    resolution: {
      murdererId: murderer.suspectId,
      victimCell,
      roomId: murderer.roomId,
    },
  };
}
