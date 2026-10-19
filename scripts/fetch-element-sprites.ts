import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Downloads the element sprites used by Mengelmoes. The app never fetches these
 * at runtime: the SVG's are committed to apps/games/public/elements/.
 *
 * Source: Microsoft Fluent Emoji (Flat), MIT.
 * https://github.com/microsoft/fluentui-emoji
 */
const OUTPUT_DIR = fileURLToPath(new URL("../apps/games/public/elements/", import.meta.url));
const ICONIFY_BASE = "https://api.iconify.design/fluent-emoji-flat";

const SPRITES: Record<string, string> = {
  water: "droplet",
  fire: "fire",
  earth: "mountain",
  air: "wind-face",
  mud: "brown-circle",
  steam: "dashing-away",
  lava: "volcano",
  energy: "high-voltage",
  rain: "cloud-with-rain",
  dust: "sparkles",
  plant: "seedling",
  stone: "rock",
  cloud: "cloud",
  life: "dna",
  metal: "gear",
  tree: "deciduous-tree",
  wood: "wood",
  house: "house",
  fish: "fish",
  bird: "bird",
  human: "bust-in-silhouette",
  dragon: "dragon",
};

async function download(id: string, icon: string): Promise<void> {
  const response = await fetch(`${ICONIFY_BASE}/${icon}.svg`);
  if (!response.ok) {
    throw new Error(`Kon ${icon} niet ophalen (${response.status})`);
  }

  const svg = await response.text();
  if (!svg.startsWith("<svg")) {
    throw new Error(`Onverwacht antwoord voor ${icon}`);
  }

  await writeFile(`${OUTPUT_DIR}${id}.svg`, svg, "utf8");
  console.log(`✓ ${id}.svg`);
}

await mkdir(OUTPUT_DIR, { recursive: true });
for (const [id, icon] of Object.entries(SPRITES)) {
  await download(id, icon);
}
console.log(`Klaar: ${Object.keys(SPRITES).length} elementen.`);
