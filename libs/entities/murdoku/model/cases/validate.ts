import { VICTIM_ID } from "../engine/domain/types";
import type { Cell, PersonId } from "../engine/domain/types";
import { onePersonEachLine } from "../board-rules";
import {
  checkMurdokuLevel,
  findMurdokuMurderer,
  loadMurdokuLevel,
  validateMurdokuPlacement,
} from "../murdoku";
import type { MurdokuCase } from "./types";

/** De maten die v1 ondersteunt: 4×4 tot en met 6×6, altijd vierkant. */
const ALLOWED_SIZES = [4, 5, 6];

function solutionProblems(
  entry: MurdokuCase,
  expectedIds: readonly PersonId[],
  width: number,
): string[] {
  const ids = Object.keys(entry.solution);
  const problems: string[] = [];
  const missing = expectedIds.filter((id) => !ids.includes(id));
  const extra = ids.filter((id) => !expectedIds.includes(id));

  if (missing.includes(VICTIM_ID)) {
    problems.push(`${entry.id}: het slachtoffer ontbreekt in de oplossing`);
  }
  const missingPeople = missing.filter((id) => id !== VICTIM_ID);
  if (missingPeople.length > 0) {
    problems.push(`${entry.id}: de oplossing mist ${missingPeople.join(", ")}`);
  }
  if (extra.length > 0) {
    problems.push(`${entry.id}: de oplossing kent onbekende personen ${extra.join(", ")}`);
  }

  const widthCells = width;
  const size = widthCells * widthCells;
  const outside = Object.entries(entry.solution).filter(([, cell]) => cell < 0 || cell >= size);
  if (outside.length > 0) {
    problems.push(`${entry.id}: de oplossing wijst vakjes buiten het bord aan`);
  }
  if (problems.length === 0 && !onePersonEachLine(Object.values(entry.solution), width)) {
    problems.push(`${entry.id}: de oplossing zet twee personen in dezelfde rij of kolom`);
  }
  return problems;
}

function levelProblems(entry: MurdokuCase): string[] {
  const problems: string[] = [];
  const { level } = entry;

  if (!ALLOWED_SIZES.includes(level.size.width) || level.size.width !== level.size.height) {
    problems.push(`${entry.id}: de bordmaat moet 4×4, 5×5 of 6×6 zijn`);
  }
  if (level.id !== entry.id) {
    problems.push(`${entry.id}: de level-id "${level.id}" hoort niet bij de zaak`);
  }
  if (/^gen-/.test(entry.id)) {
    problems.push(`${entry.id}: gebruik een eigen id, niet de generator-id`);
  }
  if (level.author !== undefined && level.author.trim() !== "") {
    problems.push(
      `${entry.id}: een zaak heeft geen auteur; overgenomen zaken zijn niet toegestaan`,
    );
  }
  if (level.suspects.length !== level.size.width - 1) {
    problems.push(`${entry.id}: verwacht ${level.size.width - 1} verdachten`);
  }
  if (level.suspects.some((suspect) => (suspect.clues ?? []).length === 0)) {
    problems.push(`${entry.id}: elke verdachte heeft minstens één aanwijzing nodig`);
  }
  for (const [id, room] of Object.entries(level.rooms)) {
    if (!room.nameKey.startsWith("room.")) {
      problems.push(`${entry.id}: kamer ${id} heeft geen Nederlandse kamersleutel`);
    }
  }
  return problems;
}

function engineProblems(entry: MurdokuCase): string[] {
  const problems: string[] = [];
  const check = checkMurdokuLevel(entry.level, { forwardOnly: true });
  if (!check.unique) {
    problems.push(`${entry.id}: de zaak is niet uniek oplosbaar`);
  }
  if (!check.solvable) {
    problems.push(`${entry.id}: de zaak is niet met voorwaartse deductie oplosbaar`);
  }
  if (!check.solution) {
    problems.push(`${entry.id}: de zaak heeft geen oplossing`);
    return problems;
  }

  const actual = Object.fromEntries(check.solution.entries());
  const sameSolution = Object.keys(entry.solution).every(
    (id) => actual[id as PersonId] === entry.solution[id as PersonId],
  );
  if (!sameSolution) {
    problems.push(`${entry.id}: de oplossing hoort niet bij de aanwijzingen`);
  }
  return problems;
}

function placementProblems(entry: MurdokuCase): string[] {
  const puzzle = loadMurdokuLevel(entry.level);
  const failures = validateMurdokuPlacement(puzzle, entry.solution);
  if (failures.length > 0) {
    return [`${entry.id}: de oplossing volgt de aanwijzingen niet (${failures.length} fout)`];
  }

  const murderer = findMurdokuMurderer(puzzle, entry.solution);
  if (!murderer.suspectId) {
    return [`${entry.id}: de oplossing heeft geen unieke dader`];
  }
  if (murderer.suspectsInRoom.length !== 1) {
    return [
      `${entry.id}: er staan ${murderer.suspectsInRoom.length} verdachten bij het slachtoffer`,
    ];
  }
  return [];
}

/**
 * Controleert een set eigen zaken op alles wat de build-time poort en de
 * tests nodig hebben: eigen ids en teksten, de bordmaat, een volledige
 * oplossing met één persoon per rij en kolom, en een unieke, met voorwaartse
 * deductie oplosbare zaak met precies één dader.
 *
 * Retourneert leesbare problemen; een lege lijst betekent: goed.
 */
export function validateMurdokuCases(cases: readonly MurdokuCase[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const entry of cases) {
    if (seen.has(entry.id)) {
      problems.push(`${entry.id}: dubbele zaak-id`);
    }
    seen.add(entry.id);

    if (entry.title.trim() === "") {
      problems.push(`${entry.id}: de titel ontbreekt`);
    }
    if (entry.intro.trim() === "") {
      problems.push(`${entry.id}: de intro ontbreekt`);
    }

    const level = levelProblems(entry);
    const expectedIds = [...entry.level.suspects.map((suspect) => suspect.id), VICTIM_ID];
    const solution = solutionProblems(entry, expectedIds, entry.level.size.width);
    problems.push(...level, ...solution);

    // Een kapotte borddefinitie of oplossing zou de engine laten ontsporen;
    // stop dan met de duurdere controles voor deze zaak.
    if (level.length > 0 || solution.length > 0) continue;

    problems.push(...placementProblems(entry), ...engineProblems(entry));
  }

  return problems;
}
