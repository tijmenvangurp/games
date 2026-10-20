import { describe, expect, it } from "vitest";
import { gameCatalog } from "@entities/game";
import { loadSpeechGroups } from "../../scripts/lib/audio-catalog.ts";

describe("spraakdekking per game", () => {
  it("geeft elke available game een expliciete spraakverklaring", async () => {
    const groups = await loadSpeechGroups();
    const folders = new Set(groups.map(({ group }) => group.folder));
    const available = gameCatalog.filter((game) => game.status === "available");

    expect(available.length).toBeGreaterThan(0);
    for (const game of available) {
      if (game.speech.kind === "group") {
        for (const folder of game.speech.folders) {
          expect(folders.has(folder), `${game.id}: ${folder}`).toBe(true);
        }
      } else {
        expect(game.speech.reason.trim().length, game.id).toBeGreaterThan(0);
      }
    }
  });

  it("laat geen audiogroep zonder game achter", async () => {
    const groups = await loadSpeechGroups();
    const used = new Set(
      gameCatalog.flatMap((game) =>
        game.status === "available" && game.speech.kind === "group" ? game.speech.folders : [],
      ),
    );

    for (const { group } of groups) {
      expect(used.has(group.folder), group.folder).toBe(true);
    }
  });
});
