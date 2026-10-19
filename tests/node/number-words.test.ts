import { describe, expect, it } from "vitest";
import { dutchNumberWord } from "@entities/math";

describe("dutchNumberWord", () => {
  it("schrijft de kleine getallen uit", () => {
    expect(dutchNumberWord(0)).toBe("nul");
    expect(dutchNumberWord(1)).toBe("één");
    expect(dutchNumberWord(8)).toBe("acht");
    expect(dutchNumberWord(11)).toBe("elf");
    expect(dutchNumberWord(12)).toBe("twaalf");
    expect(dutchNumberWord(19)).toBe("negentien");
  });

  it("schrijft de tientallen en honderd uit", () => {
    expect(dutchNumberWord(20)).toBe("twintig");
    expect(dutchNumberWord(30)).toBe("dertig");
    expect(dutchNumberWord(40)).toBe("veertig");
    expect(dutchNumberWord(50)).toBe("vijftig");
    expect(dutchNumberWord(60)).toBe("zestig");
    expect(dutchNumberWord(70)).toBe("zeventig");
    expect(dutchNumberWord(80)).toBe("tachtig");
    expect(dutchNumberWord(90)).toBe("negentig");
    expect(dutchNumberWord(100)).toBe("honderd");
  });

  it("voegt eenheden en tientallen met de juiste klinker samen", () => {
    expect(dutchNumberWord(21)).toBe("eenentwintig");
    expect(dutchNumberWord(22)).toBe("tweeëntwintig");
    expect(dutchNumberWord(23)).toBe("drieëntwintig");
    expect(dutchNumberWord(24)).toBe("vierentwintig");
    expect(dutchNumberWord(32)).toBe("tweeëndertig");
    expect(dutchNumberWord(42)).toBe("tweeënveertig");
    expect(dutchNumberWord(99)).toBe("negenennegentig");
  });

  it("weigert getallen buiten de kaart", () => {
    expect(() => dutchNumberWord(-1)).toThrow(RangeError);
    expect(() => dutchNumberWord(101)).toThrow(RangeError);
    expect(() => dutchNumberWord(1.5)).toThrow(RangeError);
  });
});
