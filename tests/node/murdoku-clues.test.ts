import { describe, expect, it } from "vitest";
import { VICTIM_ID, validateMurdokuPlacement } from "@entities/murdoku";
import { MURDOKU_FIXTURE, placement } from "./murdoku-fixtures";

/** De keys van de mislukte aanwijzingen, met de persoon erbij. */
function failures(overrides: Parameters<typeof placement>[0]) {
  return validateMurdokuPlacement(MURDOKU_FIXTURE, placement(overrides)).map((failure) => ({
    personId: failure.personId,
    key: failure.explanation.key,
  }));
}

describe("murdoku aanwijzingen", () => {
  it("rekent een buurman door een muur niet als 'naast'", () => {
    // Bram staat op (0,3) in kamer 2; de tafel staat op (0,2) in kamer 1.
    const result = failures({ B: 3 });

    expect(result).toContainEqual({ personId: "B", key: "clue.nearObject" });
  });

  it("rekent een buurman in dezelfde kamer wel als 'naast'", () => {
    expect(failures({})).toEqual([]);
  });

  it("laat 'alleen' mislukken zodra het slachtoffer in dezelfde kamer staat", () => {
    // Het slachtoffer op (1,3): dezelfde kamer (2) als Anna op (0,3).
    const result = failures({ [VICTIM_ID]: 7 });

    expect(result).toEqual([{ personId: "A", key: "clue.alone" }]);
  });

  it("laat 'de enige op een stoel' mislukken als het slachtoffer ook op een stoel zit", () => {
    // Het slachtoffer op (3,3), een stoel. Bram zit op (1,2), ook een stoel.
    const result = failures({ [VICTIM_ID]: 15 });

    expect(result).toContainEqual({ personId: "B", key: "clue.uniqueOnObject" });
  });

  it("keurt een raam tussen twee vakjes aan beide kanten goed", () => {
    // Anna op (1,3), de andere kant van het raam tussen (0,3) en (1,3).
    const result = failures({ A: 7 });

    expect(result).toEqual([]);
  });
});
