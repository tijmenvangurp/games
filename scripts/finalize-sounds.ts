import { existsSync } from "node:fs";
import { copyFile, mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AANBEVOLEN_VARIANTEN,
  KLANKEN,
  type KlankMapping,
  type KlankType,
  type KlankVariant,
} from "./sounds-data.ts";

/**
 * Zet de gekozen prototypevarianten in de app en schrijft een manifest.
 *
 * Dit script doet geen TTS-aanroep. Het kopieert de gekozen bestanden uit
 * `apps/games/public/audio/letters/prototype/nathalie/` naar
 * `apps/games/public/audio/letters/v1/sounds/` en maakt `manifest.json`.
 */

interface ManifestEntry {
  teken: string;
  type: KlankType;
  variant: string;
  label: string;
  prompt: string;
  file: string;
  cut?: {
    word: string;
    from: "start" | "end";
    durationMs: number;
  };
}

interface Manifest {
  version: 1;
  voice: {
    model: string;
    label: string;
    license: string;
  };
  sounds: Record<string, ManifestEntry>;
}

interface ResolvedVariant {
  variant: KlankVariant;
  extension: "wav" | "mp3";
  source: string;
  target: string;
}

const sourceDirectory = join(
  "apps",
  "games",
  "public",
  "audio",
  "letters",
  "prototype",
  "nathalie",
);
const targetDirectory = join("apps", "games", "public", "audio", "letters", "v1", "sounds");

function resolveVariant(klank: KlankMapping): ResolvedVariant {
  const variantId = AANBEVOLEN_VARIANTEN[klank.id];
  const variant = klank.variants.find((item) => item.id === variantId);
  if (!variant) {
    throw new Error(`Geen variant "${variantId}" voor ${klank.id}.`);
  }

  const extension = variant.cut ? "wav" : "mp3";
  const source = join(sourceDirectory, klank.id, `${variant.id}.${extension}`);
  if (!existsSync(source)) {
    throw new Error(`Bronbestand ontbreekt: ${source}`);
  }

  return {
    variant,
    extension,
    source,
    target: join(targetDirectory, `${klank.id}.${extension}`),
  };
}

async function copyKlank(klank: KlankMapping, manifest: Manifest): Promise<void> {
  const { variant, extension, source, target } = resolveVariant(klank);
  await copyFile(source, target);

  const stale = join(targetDirectory, `${klank.id}.${extension === "mp3" ? "wav" : "mp3"}`);
  if (existsSync(stale)) {
    await unlink(stale);
  }

  manifest.sounds[klank.id] = {
    teken: klank.teken,
    type: klank.type,
    variant: variant.id,
    label: variant.label,
    prompt: variant.ttsPrompt,
    file: `/audio/letters/v1/sounds/${klank.id}.${extension}`,
    ...(variant.cut
      ? {
          cut: {
            word: variant.cut.word,
            from: variant.cut.from,
            durationMs: variant.cut.durationMs,
          },
        }
      : {}),
  };

  console.log(`${klank.id}: ${variant.id} -> ${target}`);
}

async function main(): Promise<void> {
  await mkdir(targetDirectory, { recursive: true });

  const manifest: Manifest = {
    version: 1,
    voice: {
      model: "speaches-ai/piper-nl_BE-nathalie-medium",
      label: "nathalie",
      license: "CC0 1.0",
    },
    sounds: {},
  };

  for (const klank of KLANKEN) {
    await copyKlank(klank, manifest);
  }

  await writeFile(join(targetDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nManifest: ${join(targetDirectory, "manifest.json")}`);
  console.log(`${Object.keys(manifest.sounds).length} klanken bijgewerkt.`);
}

await main();
