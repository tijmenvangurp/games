import { Clue } from "./Clue.ts";
import { ON_OBJECT_KEY_SUFFIX } from "./unaryClues.ts";
import type { Board } from "../domain/Board.ts";
import type { Solution } from "../domain/Solution.ts";
import type { Puzzle } from "../domain/Puzzle.ts";
import { VICTIM_ID } from "../domain/types.ts";
import type { AttributeValue, Cell, Direction, Explanation, PersonId } from "../domain/types.ts";

/** "{name} was alone." — no other person at all shares the room, NOT even the victim,
 *  so an "alone" suspect is never the murderer (the murderer is alone *with* the victim).
 *  This keeps the victim out of an "alone" room, which constrains where the body is. */
export class AloneClue extends Clue {
  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const board = puzzle.board;
    const room = board.roomIdOf(solution.cellOf(subjectId));
    for (const id of puzzle.allIds()) {
      if (id === subjectId) continue;
      if (board.roomIdOf(solution.cellOf(id)) === room) return false;
    }
    return true;
  }

  override violatedBy(
    subjectId: PersonId,
    placement: ReadonlyMap<PersonId, Cell>,
    puzzle: Puzzle,
  ): boolean {
    const cell = placement.get(subjectId);
    if (cell === undefined) return false;
    const room = puzzle.board.roomIdOf(cell);
    for (const [id, c] of placement) {
      if (id !== subjectId && puzzle.board.roomIdOf(c) === room) return true;
    }
    return false;
  }

  describe(): Explanation {
    return { key: "clue.alone" };
  }
}

/** "{name} was not alone." — at least one other person shares the subject's room. */
export class NotAloneClue extends Clue {
  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const board = puzzle.board;
    const room = board.roomIdOf(solution.cellOf(subjectId));
    for (const id of puzzle.allIds()) {
      if (id !== subjectId && board.roomIdOf(solution.cellOf(id)) === room) return true;
    }
    return false;
  }

  describe(): Explanation {
    return { key: "clue.notAlone" };
  }
}

/**
 * "{name} was alone with [people] and `extraCount` person(s) matching attr=value,
 * one of whom was `dir` of them." The room contains EXACTLY the subject, the named
 * people, and `extraCount` matching others — nobody else (not even the victim).
 * Tailored to clues like "alone with Joaquin and a woman east of her".
 */
export class AloneWithClue extends Clue {
  constructor(
    readonly people: PersonId[],
    readonly attribute: string,
    readonly value: AttributeValue,
    readonly extraCount: number,
    readonly dir: Direction | null = null,
  ) {
    super();
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const board = puzzle.board;
    const myCell = solution.cellOf(subjectId);
    const room = board.roomIdOf(myCell);
    const mates = puzzle
      .allIds()
      .filter((id) => id !== subjectId && board.roomIdOf(solution.cellOf(id)) === room);
    for (const p of this.people) if (!mates.includes(p)) return false;
    const extras = mates.filter((id) => !this.people.includes(id));
    if (extras.length !== this.extraCount) return false;
    if (!extras.every((id) => puzzle.attributesOf(id)[this.attribute] === this.value)) return false;
    if (this.dir) {
      const { row, col } = board.rc(myCell);
      const inDir = (cell: Cell): boolean => {
        const p = board.rc(cell);
        if (this.dir === "north") return p.row < row;
        if (this.dir === "south") return p.row > row;
        if (this.dir === "east") return p.col > col;
        return p.col < col;
      };
      if (!extras.some((id) => inDir(solution.cellOf(id)))) return false;
    }
    return true;
  }

  override violatedBy(
    subjectId: PersonId,
    placement: ReadonlyMap<PersonId, Cell>,
    puzzle: Puzzle,
  ): boolean {
    const cell = placement.get(subjectId);
    if (cell === undefined) return false;
    const room = puzzle.board.roomIdOf(cell);
    for (const p of this.people) {
      const pc = placement.get(p);
      if (pc !== undefined && puzzle.board.roomIdOf(pc) !== room) return true;
    }
    let extras = 0;
    for (const [id, c] of placement) {
      if (id === subjectId || puzzle.board.roomIdOf(c) !== room || this.people.includes(id))
        continue;
      if (puzzle.attributesOf(id)[this.attribute] !== this.value) return true;
      if (++extras > this.extraCount) return true;
    }
    return false;
  }

  describe(): Explanation {
    // Reflect ALL parts (named person, how many extras, their trait, optional
    // direction) so the editor preview updates when any is changed.
    const token = this.value === true ? this.attribute : `${this.attribute}_${this.value}`;
    return {
      key: this.dir ? "clue.aloneWithDir" : "clue.aloneWithPeople",
      params: {
        target: this.people[0] ?? "",
        count: this.extraCount,
        attribute: token,
        direction: this.dir ?? "",
      },
    };
  }
}

export type Quantifier = "none" | "some" | "all";

/**
 * Clue about who else shares the subject's room, by attribute — e.g.
 * "no one in his area had a beard" (none/beard/true) or "a woman was in his
 * room" (some/gender/"f"). `excludeSelf` ignores the subject in the count.
 */
export class RoomAttributeClue extends Clue {
  constructor(
    readonly quantifier: Quantifier,
    readonly attribute: string,
    readonly value: AttributeValue,
    readonly excludeSelf = false,
    /** For the 'some' quantifier: how many matching others are required
     *  ("≥ count" by default, "exactly count" when `exact`). Ignored by none/all. */
    readonly count = 1,
    /** 'some' only: `count` is an EXACT count, not a lower bound. */
    readonly exact = false,
  ) {
    super();
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const board = puzzle.board;
    const room = board.roomIdOf(solution.cellOf(subjectId));
    let total = 0;
    let matches = 0;
    for (const id of puzzle.allIds()) {
      if (this.excludeSelf && id === subjectId) continue;
      if (board.roomIdOf(solution.cellOf(id)) !== room) continue;
      total++;
      if (puzzle.attributesOf(id)[this.attribute] === this.value) matches++;
    }
    switch (this.quantifier) {
      case "none":
        return matches === 0;
      case "some":
        return this.exact ? matches === this.count : matches >= this.count;
      case "all":
        return total > 0 && matches === total;
    }
  }

  override violatedBy(
    subjectId: PersonId,
    placement: ReadonlyMap<PersonId, Cell>,
    puzzle: Puzzle,
  ): boolean {
    if (this.quantifier !== "none") return false;
    const cell = placement.get(subjectId);
    if (cell === undefined) return false;
    const room = puzzle.board.roomIdOf(cell);
    for (const [id, c] of placement) {
      if (this.excludeSelf && id === subjectId) continue;
      if (
        puzzle.board.roomIdOf(c) === room &&
        puzzle.attributesOf(id)[this.attribute] === this.value
      ) {
        return true;
      }
    }
    return false;
  }

  describe(): Explanation {
    // Gender is categorical ("a man/woman"), not a "with <trait>" attribute, so it
    // gets its own wording (none/some/all) via the nominative who-token.
    if (this.attribute === "gender") {
      const g = String(this.value);
      if (this.quantifier === "some") {
        if (this.exact) {
          return this.count >= 2
            ? { key: "clue.roomGender.someExact", params: { count: this.count, whoOtherPl: g } }
            : // `whoOther` carries the article for German ("ein anderer Mann"); `whoBare`
              // the article-free noun for English ("one other man").
              {
                key: "clue.roomGender.someExactOne",
                params: { count: this.count, whoOther: g, whoBare: g },
              };
        }
        if (this.count >= 2) {
          return { key: "clue.roomGender.someMin", params: { count: this.count, whoOtherPl: g } };
        }
        // "≥ 1 other" — the original wording, now "_other"-aware via `whoOther`; keep
        // `who` so the negated ("kein …") form still resolves.
        return { key: "clue.roomGender.some", params: { who: `${g}_nom`, whoOther: g } };
      }
      return { key: `clue.roomGender.${this.quantifier}`, params: { who: `${g}_nom` } };
    }
    // Boolean traits read as the attribute itself ("a beard"); valued traits
    // (hair colour, …) fold the value into the token so the wording can
    // distinguish "blond hair" from "brown hair" via `attr.<attribute>_<value>`.
    const token = this.value === true ? this.attribute : `${this.attribute}_${this.value}`;
    if (this.quantifier === "some") {
      if (this.exact) {
        return this.count >= 2
          ? { key: "clue.roomAttribute.someExact", params: { count: this.count, attribute: token } }
          : {
              key: "clue.roomAttribute.someExactOne",
              params: { count: this.count, attribute: token },
            };
      }
      if (this.count >= 2) {
        return {
          key: "clue.roomAttribute.someMin",
          params: { count: this.count, attribute: token },
        };
      }
      return { key: "clue.roomAttribute.some", params: { attribute: token } };
    }
    return { key: `clue.roomAttribute.${this.quantifier}`, params: { attribute: token } };
  }
}

/**
 * "{name} was alone with a {value}." — exactly `count` other people share the
 * subject's room, and every one of them matches attribute == value.
 */
export class RoomCompanionClue extends Clue {
  constructor(
    readonly count: number,
    readonly attribute: string,
    readonly value: AttributeValue,
  ) {
    super();
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const board = puzzle.board;
    const room = board.roomIdOf(solution.cellOf(subjectId));
    const others: PersonId[] = [];
    for (const id of puzzle.allIds()) {
      if (id === subjectId || id === VICTIM_ID) continue;
      if (board.roomIdOf(solution.cellOf(id)) === room) others.push(id);
    }
    if (others.length !== this.count) return false;
    return others.every((id) => puzzle.attributesOf(id)[this.attribute] === this.value);
  }

  override violatedBy(
    subjectId: PersonId,
    placement: ReadonlyMap<PersonId, Cell>,
    puzzle: Puzzle,
  ): boolean {
    const cell = placement.get(subjectId);
    if (cell === undefined) return false;
    const room = puzzle.board.roomIdOf(cell);
    let others = 0;
    for (const [id, c] of placement) {
      if (id === subjectId || id === VICTIM_ID || puzzle.board.roomIdOf(c) !== room) continue;
      others++;
      if (puzzle.attributesOf(id)[this.attribute] !== this.value) return true;
      if (others > this.count) return true;
    }
    return false;
  }

  describe(): Explanation {
    // Gender reads as "alone with a man/woman"; other traits as "alone with a person
    // who had <trait>" (the trait token reuses the attr.* wordings). ≥2 companions get
    // the plural "alone with N (other) men / N people who had …" wording.
    if (this.attribute === "gender") {
      const g = String(this.value);
      // The companions are suspects (never the victim) → "verdächtiger Mann/Männern".
      return this.count >= 2
        ? { key: "clue.aloneWithMany", params: { count: this.count, who: `${g}_datpl_susp` } }
        : { key: "clue.aloneWith", params: { who: `${g}_dat_susp` } };
    }
    const token = this.value === true ? this.attribute : `${this.attribute}_${this.value}`;
    return this.count >= 2
      ? { key: "clue.aloneWithTraitMany", params: { count: this.count, attribute: token } }
      : { key: "clue.aloneWithTrait", params: { attribute: token } };
  }
}

/**
 * Where the "someone" of a roomExists clue stood, within the subject's room:
 *  - 'on'     — standing ON an object of the given type;
 *  - 'near'   — BESIDE one in the same room (orthogonal, not on it — the game's "neben");
 *  - 'corner' — on a corner cell;  'wall' — on a cell touching a wall;
 *  - 'window' — on a cell beside a window;  'door' — beside a door.
 * 'on'/'near' use `object`; the board-position relations ignore it.
 */
export type RoomExistsRelation = "on" | "near" | "corner" | "wall" | "window" | "door";

const ROOM_EXISTS_REL_KEY: Record<RoomExistsRelation, string> = {
  on: "On",
  near: "Near",
  corner: "Corner",
  wall: "Wall",
  window: "Window",
  door: "Door",
};

/**
 * "Someone (else) was {on/beside an object | in a corner | …} in {name}'s area." —
 * some OTHER person in the subject's room (never the subject, never the victim)
 * stands somewhere matching `relation`, and matches the "who":
 *  - `person` set → it must be that specific named suspect;
 *  - else `attribute` set → attribute == value (e.g. a woman, someone with a beard);
 *  - else (attribute null, no person) → anyone qualifies.
 */
export class RoomExistsClue extends Clue {
  constructor(
    readonly attribute: string | null,
    readonly value: AttributeValue,
    readonly object: string,
    readonly relation: RoomExistsRelation = "on",
    /** A specific named suspect as the "someone" (overrides attribute/value). */
    readonly person: PersonId | null = null,
  ) {
    super();
  }

  private get usesObject(): boolean {
    return this.relation === "on" || this.relation === "near";
  }

  /** Cells where a companion would satisfy the board-position part (room-independent). */
  private positionCells(board: Board): Set<Cell> {
    switch (this.relation) {
      case "corner":
        return board.cornerCells();
      case "wall":
        return board.cellsAtWall();
      case "window":
        return board.cellsNearWindow();
      case "door":
        return board.cellsNearDoor();
      default:
        return new Set();
    }
  }

  /** Whether `id` can play the "someone" role (named person, trait/gender, or anyone). */
  matchesPerson(puzzle: Puzzle, id: PersonId): boolean {
    if (this.person !== null) return id === this.person;
    return this.attribute === null || puzzle.attributesOf(id)[this.attribute] === this.value;
  }

  /** Whether a person standing on `cell` satisfies the position part within `room`. */
  qualifies(board: Board, cell: Cell, room: string): boolean {
    if (board.roomIdOf(cell) !== room) return false;
    if (this.relation === "on") return board.tileAt(cell).hasObjectType(this.object);
    if (this.relation === "near") {
      if (board.tileAt(cell).hasObjectType(this.object)) return false;
      for (const nb of board.neighbors4(cell)) {
        if (board.roomIdOf(nb) === room && board.tileAt(nb).hasObjectType(this.object)) return true;
      }
      return false;
    }
    // Board-position relations (corner/wall/window/door): the cell itself qualifies.
    return this.positionCells(board).has(cell);
  }

  /** The subject's room must at least offer an occupiable spot where the companion
   *  could satisfy the clue — else the subject can't be there. */
  override candidateCells(board: Board): Set<Cell> {
    const spots = this.usesObject
      ? this.relation === "on"
        ? [...board.objectCells(this.object)].filter((c) => board.isOccupiable(c))
        : [...board.cellsNearObject(this.object)]
      : [...this.positionCells(board)].filter((c) => board.isOccupiable(c));
    const rooms = new Set(spots.map((c) => board.roomIdOf(c)));
    const out = new Set<Cell>();
    for (const cell of board.occupiableCells()) {
      if (rooms.has(board.roomIdOf(cell))) out.add(cell);
    }
    return out;
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const board = puzzle.board;
    const room = board.roomIdOf(solution.cellOf(subjectId));
    for (const id of puzzle.allIds()) {
      if (id === VICTIM_ID || id === subjectId) continue;
      if (this.matchesPerson(puzzle, id) && this.qualifies(board, solution.cellOf(id), room)) {
        return true;
      }
    }
    return false;
  }

  /** The "who" encoded for the `mate` renderer param: a named person, a gender, a
   *  trait, or anyone — so one set of templates renders every variant. */
  whoToken(): string {
    if (this.person !== null) return `person:${this.person}`;
    if (this.attribute === null) return "anyElse";
    if (this.attribute === "gender") return `attr:gender_${this.value}`;
    const token = this.value === true ? this.attribute : `${this.attribute}_${this.value}`;
    return `attr:${token}`;
  }

  /** The position encoded for the `pos` renderer param (solver step texts). */
  posToken(): string {
    return this.usesObject ? `${this.relation}:${this.object}` : this.relation;
  }

  describe(): Explanation {
    const params: Record<string, string> = { mateLc: this.whoToken() };
    if (this.usesObject) params.object = this.object;
    // 'on' picks the object's natural preposition (in a tent / under a parasol).
    const suffix = this.relation === "on" ? (ON_OBJECT_KEY_SUFFIX[this.object] ?? "") : "";
    return { key: `clue.roomExists${ROOM_EXISTS_REL_KEY[this.relation]}${suffix}`, params };
  }
}
