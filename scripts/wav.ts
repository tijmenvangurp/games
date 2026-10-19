/**
 * Minimale WAV-trimmer voor de klankprototype-generator.
 *
 * De TTS-server levert WAV als PCM. We knippen een kort fragment uit een
 * woord (begin of einde) en zetten daar een korte fade op, zodat de klank
 * niet met een klik begint of eindigt.
 */

export interface WavCut {
  word: string;
  from: "start" | "end";
  durationMs: number;
  fadeMs?: number;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[offset + index] ?? 0);
  }
  return value;
}

function writeAscii(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}

export function trimWav(bytes: Uint8Array, cut: WavCut): Uint8Array {
  if (bytes.length < 44 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WAVE") {
    throw new Error("TTS gaf geen geldig WAV-bestand.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let blockAlign = 0;
  let dataOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= bytes.length) {
    const id = ascii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;

    if (id === "fmt ") {
      const format = view.getUint16(body, true);
      if (format !== 1) {
        throw new Error("Alleen PCM-WAV wordt ondersteund.");
      }
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      blockAlign = view.getUint16(body + 12, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === "data") {
      dataOffset = body;
      dataLength = Math.min(size, bytes.length - body);
    }

    offset = body + size + (size % 2);
  }

  if (dataOffset < 0 || channels <= 0 || sampleRate <= 0 || bitsPerSample !== 16) {
    throw new Error("Onverwacht WAV-formaat.");
  }

  const frameSize = blockAlign || channels * 2;
  const totalFrames = Math.floor(dataLength / frameSize);
  if (totalFrames === 0) {
    throw new Error("WAV bevat geen audio.");
  }
  const requestedFrames = Math.max(1, Math.round((cut.durationMs / 1000) * sampleRate));
  const frames = Math.min(totalFrames, requestedFrames);
  const startFrame = cut.from === "start" ? 0 : Math.max(0, totalFrames - frames);
  const byteStart = dataOffset + startFrame * frameSize;
  const outputData = bytes.slice(byteStart, byteStart + frames * frameSize);
  const outputView = new DataView(outputData.buffer, outputData.byteOffset, outputData.byteLength);

  const fadeFrames = Math.min(
    frames,
    Math.max(0, Math.round(((cut.fadeMs ?? 10) / 1000) * sampleRate)),
  );
  if (fadeFrames > 0) {
    for (let frame = 0; frame < frames; frame += 1) {
      let gain = 1;
      if (cut.from === "start" && frame >= frames - fadeFrames) {
        gain = (frames - frame) / fadeFrames;
      } else if (cut.from === "end" && frame < fadeFrames) {
        gain = frame / fadeFrames;
      }

      if (gain === 1) {
        continue;
      }

      for (let channel = 0; channel < channels; channel += 1) {
        const sampleOffset = frame * frameSize + channel * 2;
        const sample = outputView.getInt16(sampleOffset, true);
        outputView.setInt16(sampleOffset, Math.round(sample * gain), true);
      }
    }
  }

  const output = new Uint8Array(44 + outputData.byteLength);
  writeAscii(output, 0, "RIFF");
  writeAscii(output, 8, "WAVE");
  writeAscii(output, 12, "fmt ");
  const headerView = new DataView(output.buffer);
  headerView.setUint32(4, 36 + outputData.byteLength, true);
  headerView.setUint32(16, 16, true);
  headerView.setUint16(20, 1, true);
  headerView.setUint16(22, channels, true);
  headerView.setUint32(24, sampleRate, true);
  headerView.setUint32(28, sampleRate * channels * 2, true);
  headerView.setUint16(32, channels * 2, true);
  headerView.setUint16(34, 16, true);
  writeAscii(output, 36, "data");
  headerView.setUint32(40, outputData.byteLength, true);
  output.set(outputData, 44);

  return output;
}
