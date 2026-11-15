import type { Clue, Explanation, PersonId, Puzzle } from "@entities/murdoku";
import { MURDOKU_NL_TEXTS } from "./nl";
import { Renderer } from "./vendored/renderer";

/**
 * De Nederlandse tekstlaag van Wie was het?.
 *
 * De engine levert alleen keys en parameters; hier worden ze één keer tot een
 * volledige zin gemaakt. De aanwijzingen op de kaart noemen de persoon bij naam
 * ("Anna stond naast een tafel"), zodat een kind niet hoeft te raden over wie
 * "zij" gaat. Hints en uitleg kunnen dezelfde renderer gebruiken.
 */
interface MurdokuText {
  /** De volledige, met naam begonnen zin van één aanwijzing. */
  clue(clue: Clue, subjectId: PersonId): string;
  /** Een engine-uitleg (hint, foutmelding) als lopende tekst. */
  explanation(explanation: Explanation, subjectId?: PersonId): string;
  /** De Nederlandse kamernaam bij een `room.*`-key. */
  roomName(nameKey: string): string;
  /** De zelfstandig naamwoordvorm van een objecttype ("Tafel"). */
  objectName(type: string): string;
  /** Een richting in gewone taal ("links", "boven"). */
  direction(direction: string): string;
}

export function createMurdokuText(puzzle: Puzzle): MurdokuText {
  const renderer = new Renderer(MURDOKU_NL_TEXTS, puzzle);
  const sentence = (value: string): string => (/[.!?)]$/.test(value) ? value : `${value}.`);

  return {
    clue: (clue, subjectId) => sentence(renderer.namedClue(clue.describe(), subjectId)),
    explanation: (explanation, subjectId) =>
      sentence(
        subjectId ? renderer.namedClue(explanation, subjectId) : renderer.render(explanation),
      ),
    /** De kamernaam zonder lidwoord, voor het bord ("keuken", niet "de keuken"). */
    roomName: (nameKey) => (renderer.lookup(nameKey) ?? nameKey).replace(/^(de|het) /, ""),
    objectName: (type) => renderer.resolveParam("objName", type),
    direction: (direction) => renderer.resolveParam("direction", direction),
  };
}
