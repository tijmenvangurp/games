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
  earth: "globe-showing-europe-africa",
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
  metal: "nut-and-bolt",
  tree: "deciduous-tree",
  wood: "wood",
  house: "house",
  fish: "fish",
  bird: "bird",
  human: "bust-in-silhouette",
  dragon: "dragon",
  wind: "leaf-fluttering-in-wind",
  storm: "cloud-with-lightning-and-rain",
  snow: "snowflake",
  ice: "ice",
  snowman: "snowman",
  sky: "sunrise-over-mountains",
  sun: "sun",
  moon: "crescent-moon",
  star: "glowing-star",
  rainbow: "rainbow",
  mountain: "mountain",
  sea: "water-wave",
  island: "desert-island",
  beach: "beach-with-umbrella",
  desert: "desert",
  cactus: "cactus",
  flower: "blossom",
  forest: "evergreen-tree",
  fruit: "red-apple",
  grass: "herb",
  animal: "paw-prints",
  dog: "dog-face",
  cat: "cat-face",
  horse: "horse-face",
  butterfly: "butterfly",
  dinosaur: "sauropod",
  farm: "house-with-garden",
  wheat: "sheaf-of-rice",
  bread: "bread",
  sugar: "candy",
  cake: "birthday-cake",
  tool: "hammer-and-wrench",
  wheel: "gear",
  cart: "shopping-cart",
  bridge: "bridge-at-night",
  boat: "sailboat",
  castle: "castle",
  village: "houses",
  city: "cityscape",
  glass: "tumbler-glass",
  electricity: "electric-plug",
  lightbulb: "light-bulb",
  computer: "desktop-computer",
  robot: "robot",
  rocket: "rocket",
  magic: "magic-wand",
  unicorn: "unicorn",
  wizard: "person-mage",
  potion: "test-tube",
  planet: "ringed-planet",
  astronaut: "astronaut",
  satellite: "satellite",
  galaxy: "milky-way",
  alien: "alien",
  lightning: "cloud-with-lightning",
  tornado: "tornado",
  fog: "fog",
  coral: "coral",
  octopus: "octopus",
  whale: "spouting-whale",
  shark: "shark",
  treasure: "gem-stone",
  egg: "egg",
  pizza: "pizza",
  cookie: "cookie",
  icecream: "ice-cream",
  sword: "crossed-swords",
  shield: "shield",
  crown: "crown",
  knight: "guard",
  king: "person-with-crown",
  heart: "anatomical-heart",
  brain: "brain",
  bone: "bone",
  hourglass: "hourglass-not-done",
  bee: "honeybee",
  honey: "honey-pot",
  frog: "frog",
  fairytale: "open-book",
};

/**
 * `sand.svg` is hand-drawn instead of downloaded: Fluent Emoji has no sand
 * sprite, and a beach or desert icon would look the same as those elements.
 */

interface IconifyIcon {
  body: string;
  width?: number;
  height?: number;
}

interface IconifyResponse {
  width: number;
  height: number;
  icons: Record<string, IconifyIcon>;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchIcons(attempt = 0): Promise<IconifyResponse> {
  const names = Object.values(SPRITES).join(",");
  const response = await fetch(`${ICONIFY_BASE}.json?icons=${encodeURIComponent(names)}`);

  if (response.status === 429 && attempt < 4) {
    await sleep(2000 * 2 ** attempt);
    return fetchIcons(attempt + 1);
  }
  if (!response.ok) {
    throw new Error(`Kon de iconenset niet ophalen (${response.status})`);
  }
  return (await response.json()) as IconifyResponse;
}

await mkdir(OUTPUT_DIR, { recursive: true });
const data = await fetchIcons();

for (const [id, icon] of Object.entries(SPRITES)) {
  const entry = data.icons[icon];
  if (!entry) {
    throw new Error(`Onbekend icoon: ${icon}`);
  }

  const width = entry.width ?? data.width;
  const height = entry.height ?? data.height;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${width} ${height}">${entry.body}</svg>`;
  await writeFile(`${OUTPUT_DIR}${id}.svg`, svg, "utf8");
  console.log(`✓ ${id}.svg`);
}

console.log(`Klaar: ${Object.keys(SPRITES).length} elementen.`);
