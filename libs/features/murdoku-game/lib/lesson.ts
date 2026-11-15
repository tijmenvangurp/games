/**
 * De inhoud van de uitleg van Wie was het?: zes schermen en een woordenlijst.
 *
 * De schermen volgen de schaaktutorial (ADR 0014): veel beeld, weinig tekst en
 * één onderwerp per scherm. Elk scherm en elk woord uit de woordenlijst heeft
 * een klein diagram. De diagrammen zijn schema's, geen echte zaken: ze leggen
 * één regel uit zonder dat het kind eerst een bord hoeft te lezen.
 *
 * De woordenlijst dekt alle aanwijzingen van de eerste versie. De betekenis
 * komt uit de boekglossarium zoals vastgelegd in de onderzoeksnotitie.
 */

/** Eén vakje in een diagram. */
export interface MurdokuDiagramCell {
  /** De letter van de persoon in dit vakje. */
  person?: string;
  /** Een objecttype uit de engine, bijvoorbeeld "bed" of "table". */
  object?: string;
  /** De kleur van het vakje: goed, fout, het gebied van de aanwijzing of de persoon. */
  tone?: "ok" | "no" | "area" | "highlight";
  /** Een vinkje of kruisje in de hoek van het vakje. */
  mark?: "check" | "cross";
  /** Een kamertint; "lit" is de kamer van het slachtoffer bij de onthulling. */
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

/** Eén scherm van de uitleg. */
export interface MurdokuLessonStep {
  id: string;
  title: string;
  body: string;
  tip?: string;
  diagram: MurdokuDiagramSpec;
}

/** Eén woord uit de woordenlijst, met de betekenis en een eigen diagram. */
export interface MurdokuGlossaryEntry {
  id: string;
  term: string;
  meaning: string;
  diagram: MurdokuDiagramSpec;
}

const CROSS = { mark: "cross" } as const satisfies MurdokuDiagramCell;

export const MURDOKU_LESSON_STEPS: readonly MurdokuLessonStep[] = [
  {
    id: "doel",
    title: "Het doel",
    body: "Er is iets gestolen. Iemand was als enige in de kamer waar het slachtoffer was. Jij zoekt uit wie dat was.",
    tip: "Het slachtoffer heet Vera en staat er ook gewoon bij.",
    diagram: {
      label: "Twee kamers. Vera en Cato staan samen in de ene kamer; de kamer ernaast is leeg.",
      rows: [
        [
          { person: "V" },
          { person: "C", tone: "highlight", wallRight: true },
          { room: "b" },
          { room: "b" },
        ],
        [{}, { wallRight: true }, { room: "b" }, { room: "b" }],
      ],
    },
  },
  {
    id: "rij-en-kolom",
    title: "Eén per rij en kolom",
    body: "Iedereen staat op precies één vakje. In elke rij en elke kolom staat maar één persoon. Daarom kun je de rij en de kolom meteen wegstrepen.",
    diagram: {
      label:
        "Een bord van vier bij vier. Anna staat linksboven; de rest van haar rij en kolom is weggestreept.",
      rows: [
        [{ person: "A" }, CROSS, CROSS, CROSS],
        [CROSS, {}, {}, {}],
        [CROSS, {}, {}, {}],
        [CROSS, {}, {}, {}],
      ],
    },
  },
  {
    id: "bezetbaar",
    title: "Wat mag je bezetten?",
    body: "Alleen op een bed, een stoel of een tapijt mag iemand staan. Een tafel, plant, tv, boekenkast en doos blijven leeg. Een raam is geen vakje: het zit op de muur.",
    diagram: {
      label:
        "Bed, stoel en tapijt met een groen vinkje. Tafel, tv, plant, boekenkast en doos met een rood kruis.",
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
  },
  {
    id: "naast",
    title: "Wat betekent naast?",
    body: "Naast is direct boven, onder, links of rechts. En het moet in dezelfde kamer zijn. Aan de andere kant van de muur is niet naast.",
    diagram: {
      label:
        "Een persoon met vier groene vakjes eromheen. De schuine vakjes en het vakje achter de muur hebben een kruis.",
      rows: [
        [CROSS, { tone: "ok" }, CROSS],
        [
          { tone: "ok" },
          { person: "A", tone: "highlight", wallRight: true },
          { room: "b", tone: "no", mark: "cross" },
        ],
        [CROSS, { tone: "ok" }, CROSS],
      ],
    },
  },
  {
    id: "spelen",
    title: "Plaatsen, kruisen en terug",
    body: "Tik op een persoon en daarna op een vakje. Tik nog eens op dat vakje om hem weg te halen. Met de kruisjesstand streep je een vakje weg, en met ongedaan maken zet je je laatste stap terug.",
    tip: "Een hint wijst eerst een rij, kolom of kamer aan. Daarna doet hij één stapje voor.",
    diagram: {
      label: "Een geplaatst persoon. De rest van zijn rij en kolom is weggestreept.",
      rows: [
        [{ person: "A", tone: "highlight" }, CROSS, CROSS],
        [CROSS, {}, {}],
      ],
    },
  },
  {
    id: "onthulling",
    title: "De onthulling",
    body: "Als iedereen staat, druk je op Controleren. De dader is de persoon die als enige bij het slachtoffer in de kamer stond. Haar kamer licht dan op.",
    diagram: {
      label: "De kamer van het slachtoffer is omlijnd. Vera en Cato staan er samen in.",
      rows: [
        [
          { person: "V", room: "lit" },
          { person: "C", room: "lit", tone: "highlight" },
          { room: "b" },
          { room: "b" },
        ],
        [{ room: "lit" }, { room: "lit", wallRight: true }, { room: "b" }, { room: "b" }],
      ],
    },
  },
];

export const MURDOKU_GLOSSARY: readonly MurdokuGlossaryEntry[] = [
  {
    id: "alleen",
    term: "alleen",
    meaning:
      "Er was niemand anders in de kamer, ook het slachtoffer niet. Het slachtoffer telt gewoon mee als persoon.",
    diagram: {
      label: "Eén persoon in een kamer. Verder is de kamer leeg.",
      rows: [
        [{}, {}, {}],
        [{}, { person: "A", tone: "highlight" }, {}],
      ],
    },
  },
  {
    id: "alleen-met",
    term: "alleen met",
    meaning: "Alleen deze twee personen waren in de kamer. Niemand anders.",
    diagram: {
      label: "Twee personen samen in een kamer. Verder is de kamer leeg.",
      rows: [
        [{}, { person: "A" }, { person: "B", tone: "highlight" }],
        [{}, {}, {}],
      ],
    },
  },
  {
    id: "leeg",
    term: "leeg",
    meaning: "Er was niemand in de kamer, ook het slachtoffer niet.",
    diagram: {
      label: "Een kamer zonder personen.",
      rows: [
        [{}, {}, {}],
        [{}, {}, {}],
      ],
    },
  },
  {
    id: "naast",
    term: "naast",
    meaning:
      "Direct boven, onder, links of rechts en in dezelfde kamer. Aan de andere kant van de muur is niet naast, en schuin ook niet.",
    diagram: {
      label:
        "Een persoon met vier groene vakjes eromheen. De schuine vakjes en het vakje achter de muur hebben een kruis.",
      rows: [
        [CROSS, { tone: "ok" }, CROSS],
        [
          { tone: "ok" },
          { person: "A", tone: "highlight", wallRight: true },
          { room: "b", tone: "no", mark: "cross" },
        ],
        [CROSS, { tone: "ok" }, CROSS],
      ],
    },
  },
  {
    id: "hoek",
    term: "hoek",
    meaning: "Waar twee muren van een kamer samenkomen. In een kamer zijn vier hoeken.",
    diagram: {
      label:
        "Een kamer rechtsonder met muren rechts en onder. De persoon staat in de hoek waar die twee muren samenkomen.",
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
  },
  {
    id: "voor-een-raam",
    term: "voor een raam",
    meaning:
      "Op een vakje dat aan een raam grenst. Een raam kan aan de rand zitten of tussen twee vakjes; dan grenst het aan twee vakjes.",
    diagram: {
      label:
        "Twee vakjes met een raam op de bovenrand. Een persoon staat op het linker vakje, dus voor een raam.",
      rows: [
        [
          { person: "A", tone: "highlight", windowTop: true },
          { tone: "ok", windowTop: true },
        ],
        [{}, {}],
      ],
    },
  },
  {
    id: "rij-en-kolom",
    term: "rij en kolom",
    meaning: "In die rij of kolom, ongeacht de kamer waar de persoon staat.",
    diagram: {
      label: "Een bord van vier bij vier. Rij twee en kolom twee lichten op rond de persoon.",
      rows: [
        [{}, { tone: "area" }, {}, {}],
        [{ tone: "area" }, { person: "A", tone: "highlight" }, { tone: "area" }, { tone: "area" }],
        [{}, { tone: "area" }, {}, {}],
        [{}, { tone: "area" }, {}, {}],
      ],
    },
  },
  {
    id: "links-en-rechts",
    term: "links en rechts",
    meaning:
      "In dezelfde rij, ergens links of rechts. Niet per se naast en niet per se in dezelfde kamer.",
    diagram: {
      label: "Een rij met een persoon in het midden en groene vakjes links en rechts van hem.",
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
  },
  {
    id: "boven-en-onder",
    term: "boven en onder",
    meaning:
      "In een hogere of lagere rij. Niet per se in dezelfde kolom en niet per se in dezelfde kamer.",
    diagram: {
      label: "Een kolom met een persoon in het midden en groene vakjes boven en onder hem.",
      rows: [
        [{ mark: "check" }],
        [{ mark: "check" }],
        [{ person: "A", tone: "highlight" }],
        [{ mark: "check" }],
        [{ mark: "check" }],
      ],
    },
  },
  {
    id: "enige-op-een-stoel",
    term: "de enige op een stoel",
    meaning:
      "Er zat niemand anders op een stoel, ook het slachtoffer niet. Hetzelfde geldt voor de enige op een tapijt of de enige naast een tafel.",
    diagram: {
      label:
        "Een persoon op een stoel met een vinkje. Een tweede stoel is leeg en heeft een kruis.",
      rows: [
        [{}, { object: "chair", person: "A", tone: "ok", mark: "check" }, {}],
        [{ object: "chair", tone: "no", mark: "cross" }, {}, {}],
      ],
    },
  },
  {
    id: "twee-personen-naast-een-tafel",
    term: "twee personen naast een tafel",
    meaning: "Precies twee personen stonden naast een tafel. Het slachtoffer kan één van hen zijn.",
    diagram: {
      label: "Een tafel met precies twee personen op de vakjes ernaast.",
      rows: [
        [{}, { person: "A", tone: "ok" }, {}],
        [{ person: "B", tone: "ok" }, { object: "table" }, {}],
        [{}, {}, {}],
      ],
    },
  },
  {
    id: "ruimte",
    term: "ruimte",
    meaning: "Elke afgesloten plek, ook een kast, de badkamer of de tuin.",
    diagram: {
      label: "Twee ruimtes met een muur ertussen. In elke ruimte staat iemand.",
      rows: [
        [{ person: "A" }, { wallRight: true }, { person: "B", room: "b" }],
        [{}, {}, { room: "b" }],
      ],
    },
  },
];

/** De tips die het werken met een zaak makkelijker maken. */
export const MURDOKU_LESSON_TIPS: readonly string[] = [
  "Staan alle personen op het bord? Dan wijst het laatste vrije vak het slachtoffer aan.",
  "Werk rustig rij voor rij en kamer voor kamer. Elke aanwijzing is waar.",
];
