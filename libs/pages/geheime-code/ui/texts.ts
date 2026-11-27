import { defineTexts } from "@shared/i18n";

/** Teksten van de Geheime Code-pagina. Nederlands is de bron. */
export const geheimeCodePageTexts = defineTexts(
  {
    title: "Geheime Code",
    allFirstTry: "Alles in één keer goed.",
    firstTry: (firstTry: number, total: number) => `${firstTry} van ${total} woorden in één keer.`,
    cracked: "Code gekraakt!",
    again: "Nog een code",
    choose: "Ander niveau",
  },
  {
    title: "Secret Code",
    allFirstTry: "All right first time.",
    firstTry: (firstTry: number, total: number) =>
      `${firstTry} of ${total} words right first time.`,
    cracked: "Code cracked!",
    again: "Another code",
    choose: "Other level",
  },
);
