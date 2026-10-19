const SMALL: readonly string[] = [
  "nul",
  "een",
  "twee",
  "drie",
  "vier",
  "vijf",
  "zes",
  "zeven",
  "acht",
  "negen",
  "tien",
  "elf",
  "twaalf",
  "dertien",
  "veertien",
  "vijftien",
  "zestien",
  "zeventien",
  "achttien",
  "negentien",
];

const TENS: readonly string[] = [
  "",
  "",
  "twintig",
  "dertig",
  "veertig",
  "vijftig",
  "zestig",
  "zeventig",
  "tachtig",
  "negentig",
];

function unitWord(unit: number): string {
  return SMALL[unit] ?? "";
}

function joinTens(unit: number, tens: number): string {
  const between = unit === 2 || unit === 3 ? "ën" : "en";
  return `${unitWord(unit)}${between}${TENS[tens]}`;
}

/**
 * Het Nederlandse woord voor een getal van 0 tot en met 100, zoals TTS het
 * moet uitspreken. Buiten dat bereik is er geen geldige kaart.
 */
export function dutchNumberWord(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new RangeError(`Geen Nederlands getalwoord voor ${value}.`);
  }
  if (value === 100) {
    return "honderd";
  }
  if (value === 1) {
    return "één";
  }
  if (value < 20) {
    return SMALL[value] as string;
  }
  if (value % 10 === 0) {
    return TENS[value / 10] as string;
  }

  const tens = Math.floor(value / 10);
  const unit = value % 10;
  return joinTens(unit, tens);
}
