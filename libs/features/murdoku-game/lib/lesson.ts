/**
 * De inhoud van de uitleg van Wie was het?: zeven schermen en een woordenlijst.
 *
 * De schermen volgen de schaaktutorial (ADR 0014): veel beeld, weinig tekst en
 * één onderwerp per scherm. Elk scherm en elk woord uit de woordenlijst heeft
 * een klein diagram. De diagrammen zijn schema's, geen echte zaken: ze leggen
 * één regel uit zonder dat het kind eerst een bord hoeft te lezen.
 *
 * De woordenlijst dekt alle aanwijzingen van de eerste versie. De betekenis
 * komt uit de boekglossarium zoals vastgelegd in de onderzoeksnotitie. De
 * teksten per taal staan in `./lesson-texts.ts`; hier staan alleen de schema's.
 */

import type { MurdokuGlossaryId, MurdokuLessonStepId } from "./lesson-texts";

/** Eén vakje in een diagram. */
export interface MurdokuDiagramCell {
  /** De letter van de persoon in dit vakje. */
  person?: string;
  /** Een objecttype uit de engine, bijvoorbeeld "bed" of "table". */
  object?: string;
  /** Een lokaal elementicoon van de buit, bijvoorbeeld "cake" of "key". */
  loot?: string;
  /** De kleur van het vakje: goed, fout, het gebied van de aanwijzing of de persoon. */
  tone?: "ok" | "no" | "area" | "highlight";
  /** Een vinkje of kruisje in de hoek van het vakje. */
  mark?: "check" | "cross";
  /** Een kamertint; "lit" is de kamer van de buit bij de onthulling. */
  room?: "a" | "b" | "lit";
  /** Een dikke muur rechts van dit vakje. */
  wallRight?: boolean;
  /** Een dikke muur onder dit vakje. */
  wallBottom?: boolean;
  /** Een raam op de bovenrand van dit vakje. */
  windowTop?: boolean;
}

/** Een klein schema met een beschrijving voor schermlezers. */
export interface MurdokuDiagramSpec {
  label: string;
  rows: MurdokuDiagramCell[][];
}

/** Eén scherm van de uitleg: de teksten komen uit `MURDOKU_LESSON_TEXTS`. */
interface MurdokuLessonStep {
  id: MurdokuLessonStepId;
  rows: MurdokuDiagramCell[][];
}

/** Eén woord uit de woordenlijst, met een eigen diagram. */
interface MurdokuGlossaryEntry {
  id: MurdokuGlossaryId;
  rows: MurdokuDiagramCell[][];
}

const CROSS = { mark: "cross" } as const satisfies MurdokuDiagramCell;

/** De vier buurvakjes van "naast": een muur ertussen telt niet mee. */
const NEXT_TO_ROWS: MurdokuDiagramCell[][] = [
  [CROSS, { tone: "ok" }, CROSS],
  [
    { tone: "ok" },
    { person: "A", tone: "highlight", wallRight: true },
    { room: "b", tone: "no", mark: "cross" },
  ],
  [CROSS, { tone: "ok" }, CROSS],
];

/** Alle rijen boven de persoon: samen het halfvlak van "in een hogere rij dan". */
const HALF_PLANE_ROWS: MurdokuDiagramCell[][] = [
  [
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
  ],
  [
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
  ],
  [
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
    { tone: "ok", mark: "check" },
  ],
  [{}, { person: "A", tone: "highlight" }, {}, {}],
];

export const MURDOKU_LESSON_STEPS: readonly MurdokuLessonStep[] = [
  {
    id: "doel",
    rows: [
      [
        { loot: "cake" },
        { person: "C", tone: "highlight", wallRight: true },
        { room: "b" },
        { room: "b" },
      ],
      [{}, { wallRight: true }, { room: "b" }, { room: "b" }],
    ],
  },
  {
    id: "rij-en-kolom",
    rows: [
      [{ person: "A" }, CROSS, CROSS, CROSS],
      [CROSS, {}, {}, {}],
      [CROSS, {}, {}, {}],
      [CROSS, {}, {}, {}],
    ],
  },
  {
    id: "bezetbaar",
    rows: [
      [
        { object: "bed", tone: "ok", mark: "check" },
        { object: "chair", tone: "ok", mark: "check" },
        { object: "carpet", tone: "ok", mark: "check" },
        { object: "table", tone: "no", mark: "cross" },
      ],
      [
        { object: "tv", tone: "no", mark: "cross" },
        { object: "plant", tone: "no", mark: "cross" },
        { object: "shelf", tone: "no", mark: "cross" },
        { object: "box", tone: "no", mark: "cross" },
      ],
    ],
  },
  {
    id: "naast",
    rows: NEXT_TO_ROWS,
  },
  {
    id: "hoger-en-lager",
    rows: HALF_PLANE_ROWS,
  },
  {
    id: "spelen",
    rows: [
      [{ person: "A", tone: "highlight" }, CROSS, CROSS],
      [CROSS, {}, {}],
    ],
  },
  {
    id: "onthulling",
    rows: [
      [
        { loot: "cake", room: "lit" },
        { person: "C", room: "lit", tone: "highlight" },
        { room: "b" },
        { room: "b" },
      ],
      [{ room: "lit" }, { room: "lit", wallRight: true }, { room: "b" }, { room: "b" }],
    ],
  },
];

export const MURDOKU_GLOSSARY: readonly MurdokuGlossaryEntry[] = [
  {
    id: "buit",
    rows: [
      [{}, {}, {}],
      [{}, { loot: "cake", tone: "highlight" }, {}],
    ],
  },
  {
    id: "dief",
    rows: [
      [{}, { loot: "cake" }, {}],
      [{}, { person: "A", tone: "highlight" }, {}],
    ],
  },
  {
    id: "naast",
    rows: NEXT_TO_ROWS,
  },
  {
    id: "hoek",
    rows: [
      [{ room: "b" }, { room: "b" }, { room: "b" }],
      [{ room: "b" }, {}, { wallRight: true }],
      [
        { room: "b" },
        { wallBottom: true },
        { person: "A", tone: "highlight", wallRight: true, wallBottom: true },
      ],
    ],
  },
  {
    id: "voor-een-raam",
    rows: [
      [
        { person: "A", tone: "highlight", windowTop: true },
        { tone: "ok", windowTop: true },
      ],
      [{}, {}],
    ],
  },
  {
    id: "rij-en-kolom",
    rows: [
      [{}, { tone: "area" }, {}, {}],
      [{ tone: "area" }, { person: "A", tone: "highlight" }, { tone: "area" }, { tone: "area" }],
      [{}, { tone: "area" }, {}, {}],
      [{}, { tone: "area" }, {}, {}],
    ],
  },
  {
    id: "links-en-rechts",
    rows: [
      [
        { mark: "check" },
        { mark: "check" },
        { person: "A", tone: "highlight" },
        { mark: "check" },
        { mark: "check" },
      ],
    ],
  },
  {
    id: "boven-en-onder",
    rows: HALF_PLANE_ROWS,
  },
  {
    id: "ruimte",
    rows: [
      [{ person: "A" }, { wallRight: true }, { person: "B", room: "b" }],
      [{}, {}, { room: "b" }],
    ],
  },
];
