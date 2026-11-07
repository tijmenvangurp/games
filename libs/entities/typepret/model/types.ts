export type FingerId =
  | "linker-pink"
  | "linker-ringvinger"
  | "linker-middelvinger"
  | "linker-wijsvinger"
  | "rechter-wijsvinger"
  | "rechter-middelvinger"
  | "rechter-ringvinger"
  | "rechter-pink";

export interface Finger {
  readonly id: FingerId;
  /** Tekstlabel, zodat de vinger niet van kleur alleen afhangt. */
  readonly label: string;
  readonly hand: "links" | "rechts";
}

export type LessonKind = "oefenreeks" | "woorden";

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: LessonKind;
  /** Alle toetsen die in deze les voorkomen, inclusief eerder geleerde. */
  readonly keys: readonly string[];
  /** Toetsen die in deze les nieuw zijn. Leeg bij herhaling en woorden. */
  readonly newKeys: readonly string[];
  /** Alleen bij woorden: kortste en langste woord. */
  readonly wordLength?: { readonly min: number; readonly max: number };
}

/** Eén groep doeltekens, zoals `fj` of `slak`, als losse eenheid op het scherm. */
export type Group = string;

export interface Round {
  readonly lessonId: string;
  readonly groups: readonly Group[];
  /** Alle doeltekens van alle groepen achter elkaar. */
  readonly targets: readonly string[];
}

export interface RoundState {
  readonly round: Round;
  /** Index van het huidige doelteken; gelijk aan `targets.length` als de ronde klaar is. */
  readonly index: number;
  readonly correct: number;
  /** Fouten, maximaal één per doelteken. */
  readonly errors: number;
  /** Fouten op het huidige doelteken, ook de herhaalde. */
  readonly mistakesOnTarget: number;
  /** Doeltekens waarop het kind minstens één keer miste. */
  readonly missed: readonly string[];
  readonly finished: boolean;
}

export type Verdict = "ontgrendeld" | "bijna" | "nogmaals";

export interface RoundResult {
  readonly lessonId: string;
  readonly accuracy: number;
  readonly verdict: Verdict;
  readonly correct: number;
  readonly errors: number;
  readonly missed: readonly string[];
}

export interface LogEntry {
  readonly lessonId: string;
  readonly accuracy: number;
  readonly at: number;
}

export interface Progress {
  /** Lessen die met genoeg nauwkeurigheid zijn afgerond. */
  readonly completed: readonly string[];
  /** Beste nauwkeurigheid per les (0..1). */
  readonly best: Readonly<Record<string, number>>;
  /** Begrensd, laatste rondes achteraan. Lokaal, zonder persoonsgegevens. */
  readonly log: readonly LogEntry[];
}
