import { writeFile } from "node:fs/promises";
import {
  MURDOKU_LEVELS_FILE,
  buildMurdokuLevels,
  checkMurdokuLevelsFile,
  renderMurdokuLevels,
} from "./lib/murdoku-levels";

/**
 * Maakt de twaalf eigen zaken van Wie was het? met vaste seeds.
 *
 * Run `pnpm run murdoku:levels` om opnieuw te genereren en
 * `pnpm run murdoku:levels:check` om het gecommitte bestand te controleren
 * zonder te schrijven. De generator is build-time: de client genereert nooit.
 *
 * Elke zaak moet uniek zijn, met voorwaartse deductie oplosbaar zijn en precies
 * één dader hebben. De levelbestanden van de MIT-repo en de Murdoku-boeken
 * worden niet gebruikt; alle zaken komen uit de eigen seeds hierboven.
 */

const check = process.argv.includes("--check");

if (check) {
  const problems = await checkMurdokuLevelsFile();
  if (problems.length > 0) {
    console.error(
      `De murdokuzaken kloppen niet:\n  ${problems.join("\n  ")}\n\nDraai \`pnpm run murdoku:levels\`.`,
    );
    process.exitCode = 1;
  } else {
    console.log(`Murdokuzaken ok: 12 eigen zaken in ${MURDOKU_LEVELS_FILE}`);
  }
} else {
  const data = buildMurdokuLevels();
  await writeFile(MURDOKU_LEVELS_FILE, await renderMurdokuLevels(data), "utf8");
  console.log(`${data.cases.length} eigen zaken geschreven naar ${MURDOKU_LEVELS_FILE}`);
}
