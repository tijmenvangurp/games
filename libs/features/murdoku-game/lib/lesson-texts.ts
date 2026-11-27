import { defineTexts } from "@shared/i18n";

/**
 * De teksten van de uitleg van Wie was het?: per scherm en per woord de titel,
 * de uitleg, de tip en de beschrijving van het diagram voor schermlezers. De
 * diagrammen zelf staan in `./lesson.ts`. Een scherm zonder tip heeft een lege
 * tip.
 */
export const MURDOKU_LESSON_TEXTS = defineTexts(
  {
    steps: {
      doel: {
        title: "Het doel",
        body: "Er is iets gestolen. De buit staat nog op de plek waar de dief hem achterliet. Jij zoekt de persoon die als enige bij de buit in de kamer was.",
        tip: "De buit is bijvoorbeeld een taart of een sleutel en staat gewoon op de plattegrond.",
        label:
          "Twee kamers. De taart en Cato staan samen in de ene kamer; de kamer ernaast is leeg.",
      },
      "rij-en-kolom": {
        title: "Eén per rij en kolom",
        body: "Iedereen staat op precies één vakje. In elke rij en elke kolom staat maar één persoon. Daarom kun je de rij en de kolom meteen wegstrepen.",
        tip: "",
        label:
          "Een bord van vier bij vier. Anna staat linksboven; de rest van haar rij en kolom is weggestreept.",
      },
      bezetbaar: {
        title: "Wat mag je bezetten?",
        body: "Alleen op een bed, een stoel of een tapijt mag iemand staan. Een tafel, plant, tv, boekenkast en doos blijven leeg. Een raam is geen vakje: het zit op de muur.",
        tip: "",
        label:
          "Bed, stoel en tapijt met een groen vinkje. Tafel, tv, plant, boekenkast en doos met een rood kruis.",
      },
      naast: {
        title: "Wat betekent naast?",
        body: "Naast is direct boven, onder, links of rechts. En het moet in dezelfde kamer zijn. Aan de andere kant van de muur is niet naast.",
        tip: "",
        label:
          "Een persoon met vier groene vakjes eromheen. De schuine vakjes en het vakje achter de muur hebben een kruis.",
      },
      "hoger-en-lager": {
        title: "Hoger en lager",
        body: '"In een hogere rij dan" of "in een lagere rij dan" gaat over elke rij hoger of lager, ook als de kolom anders is. "Naast" is juist de directe buur boven, onder, links of rechts in dezelfde kamer.',
        tip: "Kijk naar de hele rij, niet alleen naar de cel direct boven of onder.",
        label:
          "Een bord met vier rijen. De persoon staat onderaan; alle vakjes in de drie rijen daarboven zijn groen, ook in andere kolommen.",
      },
      spelen: {
        title: "Plaatsen, kruisen en terug",
        body: "Tik op een persoon en daarna op een vakje. Tik nog eens op dat vakje om hem weg te halen. Met de kruisjesstand streep je een vakje weg, en met ongedaan maken zet je je laatste stap terug.",
        tip: "Een hint wijst eerst een rij, kolom of kamer aan. Daarna doet hij één stapje voor.",
        label: "Een geplaatst persoon. De rest van zijn rij en kolom is weggestreept.",
      },
      onthulling: {
        title: "De onthulling",
        body: "Als iedereen staat, druk je op Controleren. De dief is de persoon die als enige bij de buit in de kamer stond. De kamer van de buit licht dan op.",
        tip: "",
        label: "De kamer van de buit is omlijnd. De taart en Cato staan er samen in.",
      },
    },
    glossary: {
      buit: {
        term: "de buit",
        meaning:
          "Het voorwerp dat gestolen is. De buit staat op de plattegrond en telt niet mee als persoon; alleen de dief stond er als enige bij.",
        label: "De taart staat alleen in een kamer. Verder is de kamer leeg.",
      },
      dief: {
        term: "de dief",
        meaning:
          "De enige verdachte die in dezelfde kamer als de buit stond. De kamer van de buit licht bij de onthulling op.",
        label: "De taart en een persoon staan samen in een kamer.",
      },
      naast: {
        term: "naast",
        meaning:
          "Direct boven, onder, links of rechts en in dezelfde kamer. Aan de andere kant van de muur is niet naast, en schuin ook niet.",
        label:
          "Een persoon met vier groene vakjes eromheen. De schuine vakjes en het vakje achter de muur hebben een kruis.",
      },
      hoek: {
        term: "hoek",
        meaning: "Waar twee muren van een kamer samenkomen. In een kamer zijn vier hoeken.",
        label:
          "Een kamer rechtsonder met muren rechts en onder. De persoon staat in de hoek waar die twee muren samenkomen.",
      },
      "voor-een-raam": {
        term: "voor een raam",
        meaning:
          "Op een vakje dat aan een raam grenst. Een raam kan aan de rand zitten of tussen twee vakjes; dan grenst het aan twee vakjes.",
        label:
          "Twee vakjes met een raam op de bovenrand. Een persoon staat op het linker vakje, dus voor een raam.",
      },
      "rij-en-kolom": {
        term: "rij en kolom",
        meaning: "In die rij of kolom, ongeacht de kamer waar de persoon staat.",
        label: "Een bord van vier bij vier. Rij twee en kolom twee lichten op rond de persoon.",
      },
      "links-en-rechts": {
        term: "links en rechts",
        meaning:
          'In dezelfde rij, ergens links of rechts: "links van" of "rechts van". Niet per se naast en niet per se in dezelfde kamer.',
        label: "Een rij met een persoon in het midden en groene vakjes links en rechts van hem.",
      },
      "boven-en-onder": {
        term: "boven en onder",
        meaning:
          'Elke rij hoger of lager dan de ander, ook als de kolom anders is: "in een hogere rij dan" of "in een lagere rij dan". Direct boven de ander is iets anders; dat is "naast".',
        label:
          "Een bord met vier rijen. De persoon staat onderaan; alle vakjes in de drie rijen daarboven zijn groen, ook in andere kolommen.",
      },
      ruimte: {
        term: "ruimte",
        meaning: "Elke afgesloten plek, ook een kast, de badkamer of de tuin.",
        label: "Twee ruimtes met een muur ertussen. In elke ruimte staat iemand.",
      },
    },
    /** De tips die het werken met een zaak makkelijker maken. */
    tips: [
      "Staan alle personen op het bord? Dan wijst het laatste vrije vak de buit aan.",
      "Werk rustig rij voor rij en kamer voor kamer. Elke aanwijzing is waar.",
    ],
  },
  {
    steps: {
      doel: {
        title: "The goal",
        body: "Something has been stolen. The loot is still where the thief left it. You are looking for the one person who was alone with the loot in the room.",
        tip: "The loot might be a cake or a key, and it is right there on the floor plan.",
        label:
          "Two rooms. The cake and Cato are together in one room; the room next to it is empty.",
      },
      "rij-en-kolom": {
        title: "One per row and column",
        body: "Everyone stands on exactly one square. Each row and each column has only one person. So you can cross out the rest of that row and column straight away.",
        tip: "",
        label:
          "A board of four by four. Anna is in the top left; the rest of her row and column is crossed out.",
      },
      bezetbaar: {
        title: "Where can people stand?",
        body: "People can only stand on a bed, a chair or a carpet. A table, plant, TV, bookcase and box stay empty. A window is not a square: it is part of the wall.",
        tip: "",
        label:
          "Bed, chair and carpet with a green tick. Table, TV, plant, bookcase and box with a red cross.",
      },
      naast: {
        title: "What does next to mean?",
        body: "Next to means right above, below, to the left or to the right. And it has to be in the same room. The other side of a wall is not next to.",
        tip: "",
        label:
          "A person with four green squares around them. The diagonal squares and the square behind the wall have a cross.",
      },
      "hoger-en-lager": {
        title: "Higher and lower",
        body: '"In a higher row than" or "in a lower row than" means any row higher or lower, even in a different column. "Next to" only means the square right above, below, left or right in the same room.',
        tip: "Look at the whole row, not just the square right above or below.",
        label:
          "A board with four rows. The person is at the bottom; all the squares in the three rows above are green, in other columns too.",
      },
      spelen: {
        title: "Placing, crossing and undoing",
        body: "Tap a person and then a square. Tap that square again to take them off. Cross mode lets you cross out a square, and Undo takes back your last step.",
        tip: "A hint first points to a row, column or room. Then it shows you one small step.",
        label: "A placed person. The rest of their row and column is crossed out.",
      },
      onthulling: {
        title: "The reveal",
        body: "When everyone is on the board, press Check. The thief is the one person who was alone with the loot in the room. The loot's room then lights up.",
        tip: "",
        label: "The loot's room has an outline. The cake and Cato are in it together.",
      },
    },
    glossary: {
      buit: {
        term: "the loot",
        meaning:
          "The thing that was stolen. The loot is on the floor plan and does not count as a person; only the thief was alone with it.",
        label: "The cake is alone in a room. The rest of the room is empty.",
      },
      dief: {
        term: "the thief",
        meaning:
          "The only suspect who was in the same room as the loot. The loot's room lights up at the reveal.",
        label: "The cake and a person are together in a room.",
      },
      naast: {
        term: "next to",
        meaning:
          "Right above, below, to the left or to the right, and in the same room. The other side of a wall is not next to, and neither is diagonal.",
        label:
          "A person with four green squares around them. The diagonal squares and the square behind the wall have a cross.",
      },
      hoek: {
        term: "corner",
        meaning: "Where two walls of a room meet. A room has four corners.",
        label:
          "A room in the bottom right with walls on the right and at the bottom. The person is in the corner where those two walls meet.",
      },
      "voor-een-raam": {
        term: "by a window",
        meaning:
          "On a square that touches a window. A window can be on the edge or between two squares; then it touches both squares.",
        label:
          "Two squares with a window along the top edge. A person is on the left square, so by a window.",
      },
      "rij-en-kolom": {
        term: "row and column",
        meaning: "In that row or column, whichever room the person is in.",
        label: "A board of four by four. Row two and column two light up around the person.",
      },
      "links-en-rechts": {
        term: "left and right",
        meaning:
          'In the same row, somewhere to the left or right: "to the left of" or "to the right of". Not always next to, and not always in the same room.',
        label: "A row with a person in the middle and green squares to their left and right.",
      },
      "boven-en-onder": {
        term: "above and below",
        meaning:
          'Any row higher or lower than the other person, even in a different column: "in a higher row than" or "in a lower row than". Right above the other person is something else; that is "next to".',
        label:
          "A board with four rows. The person is at the bottom; all the squares in the three rows above are green, in other columns too.",
      },
      ruimte: {
        term: "room",
        meaning: "Any closed-off space, even a cupboard, the bathroom or the garden.",
        label: "Two rooms with a wall between them. There is someone in each room.",
      },
    },
    tips: [
      "Is everyone on the board? Then the last free square points to the loot.",
      "Take your time, row by row and room by room. Every clue is true.",
    ],
  },
);

export type MurdokuLessonStepId = keyof (typeof MURDOKU_LESSON_TEXTS)["nl"]["steps"];
export type MurdokuGlossaryId = keyof (typeof MURDOKU_LESSON_TEXTS)["nl"]["glossary"];
