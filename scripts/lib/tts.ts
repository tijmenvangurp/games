/**
 * Kleine, gedeelde TTS-client voor de offline audiogeneratoren.
 *
 * De URL en sleutel komen uit environment variables en worden nooit gelogd.
 * De private helper uit de skill vult die variabelen in.
 */
export interface TtsConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly voice: string;
  readonly apiKey?: string;
  readonly speed: number;
}

export interface TtsDefaults {
  readonly model: string;
  readonly voice: string;
  readonly speed: number;
}

export const NATHALIE_DEFAULTS: TtsDefaults = {
  model: "speaches-ai/piper-nl_BE-nathalie-medium",
  voice: "nathalie",
  speed: 0.95,
};

function readSpeed(defaultSpeed: number): number {
  const value = Number(process.env.TTS_SPEED ?? defaultSpeed);
  if (!Number.isFinite(value) || value < 0.25 || value > 4) {
    throw new Error("TTS_SPEED moet tussen 0.25 en 4 liggen.");
  }
  return value;
}

export function readTtsConfig(defaults: TtsDefaults): TtsConfig {
  const baseUrl = process.env.TTS_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("TTS_BASE_URL ontbreekt.");
  }

  return {
    baseUrl,
    model: process.env.TTS_MODEL ?? defaults.model,
    voice: process.env.TTS_VOICE ?? defaults.voice,
    ...(process.env.TTS_API_KEY ? { apiKey: process.env.TTS_API_KEY } : {}),
    speed: readSpeed(defaults.speed),
  };
}

export function looksLikeMp3(bytes: Uint8Array): boolean {
  const id3 = bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const frame = bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  return id3 || frame;
}

export async function requestSpeechMp3(config: TtsConfig, input: string): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        voice: config.voice,
        input,
        response_format: "mp3",
        speed: config.speed,
      }),
    });
  } catch {
    throw new Error("TTS-verzoek mislukt (netwerk).");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`TTS gaf ${response.status}: ${detail.slice(0, 200)}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}
