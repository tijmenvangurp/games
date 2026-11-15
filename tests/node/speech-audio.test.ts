import { describe, expect, it } from "vitest";
import type { SpeechLine } from "@shared/lib";
import {
  audioFileFor,
  checkAudio,
  flattenSpeechLines,
  loadSpeechGroups,
  needsAudio,
  readLock,
  relativeAudioPath,
  textHash,
} from "../../scripts/lib/audio-catalog.ts";

describe("spraakcatalogus en audio", () => {
  it("ontdekt de catalogi en heeft voor elke regel audio", async () => {
    const groups = await loadSpeechGroups();
    const lines = flattenSpeechLines(groups);

    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(lines.length).toBeGreaterThanOrEqual(170);
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length);
    expect(await checkAudio(lines)).toEqual([]);
  });

  it("houdt de lock en de bestanden bij", async () => {
    const groups = await loadSpeechGroups();
    const line = flattenSpeechLines(groups).find((entry) => entry.id === "math-number-5");
    if (!line) {
      throw new Error("Geen rekenregel gevonden");
    }

    const lock = await readLock();
    expect(lock.entries[line.id]?.folder).toBe("math");
    expect(needsAudio(line, lock, false)).toBe(false);
    expect(needsAudio(line, lock, true)).toBe(true);
    expect(needsAudio({ ...line, text: "iets anders" }, lock, false)).toBe(true);
    expect(audioFileFor(line)).toContain("apps/games/public/audio/nl/math");
    expect(relativeAudioPath(line)).toContain("apps/games/public/audio/nl/math");
    expect(textHash(line)).not.toBe(textHash({ ...line, text: "iets anders" }));
  });

  it("meldt een ontbrekende regel", async () => {
    const missing: SpeechLine = {
      folder: "math",
      id: "math-bestaat-niet",
      text: "Deze bestaat niet.",
    };
    const issues = await checkAudio([missing]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("audio.lock.json");
  });
});
