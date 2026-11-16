import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { gameCatalog } from "@entities/game";

const ROOT = process.cwd();

function murdokuEntry() {
  const entry = gameCatalog.find((game) => game.id === "murdoku");
  if (!entry || entry.status !== "available") {
    throw new Error("Wie was het? ontbreekt in de spelcatalogus");
  }
  return entry;
}

describe("Wie was het? in de spelcatalogus", () => {
  it("heeft een definitieve naam, route, beschrijving en spraakverklaring", () => {
    const entry = murdokuEntry();

    expect(entry.name).toBe("Wie was het?");
    expect(entry.to).toBe("/mysterie");
    expect(entry.description).toBe(
      "Lees de aanwijzingen, vul de plattegrond in en vind wie als enige bij het slachtoffer was.",
    );
    expect(entry.speech).toEqual({
      kind: "visual",
      reason: "De plattegrond, de portretten en de aanwijzingen zijn visueel.",
    });
    expect(entry.name).not.toMatch(/murdoku/i);
    expect(entry.to).not.toMatch(/murdoku/i);
    expect(entry.thumbnail).not.toMatch(/murdoku/i);
  });

  it("gebruikt een lokale thumbnail van 800 × 500 met een contenthash", async () => {
    const entry = murdokuEntry();
    const match = /^\/thumbnails\/wie-was-het-([0-9a-f]{8})\.jpg$/.exec(entry.thumbnail);
    expect(match).not.toBeNull();

    const file = path.join(ROOT, "apps", "games", "public", entry.thumbnail);
    const [bytes, info] = await Promise.all([readFile(file), stat(file)]);
    expect(bytes.byteLength).toBeGreaterThan(1_000);
    expect(info.size).toBe(bytes.byteLength);

    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
    expect(hash).toBe(match?.[1]);

    const metadata = await sharp(bytes).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(500);
  });
});
