import { TrackMetadata } from '../types';
import { validateMetadataForExport } from './metadataValidation';

/**
 * Encode an AudioBuffer into 16-bit or 24-bit integer PCM WAV with limited RIFF INFO text chunks.
 */
export function encodeWavBuffer(
  buffer: AudioBuffer,
  bitDepth: 16 | 24,
  metadata?: TrackMetadata
): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  if (numChannels < 1 || numChannels > 2) throw new Error('WAV encoding supports mono or stereo buffers only.');
  if (metadata) validateMetadataForExport(metadata);

  const bytesPerSample = bitDepth === 24 ? 3 : 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const dataPad = dataSize % 2;

  // Build LIST INFO Chunk if metadata exists
  const infoChunkBytes = metadata ? buildRiffInfoChunk(metadata) : new Uint8Array(0);
  const totalRiffLength = 36 + dataSize + dataPad + infoChunkBytes.byteLength;

  const outBuffer = new ArrayBuffer(8 + totalRiffLength);
  const view = new DataView(outBuffer);

  let offset = 0;

  // 1. RIFF Header
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, totalRiffLength, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;

  // 2. fmt Chunk
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // SubChunk1Size (16 for PCM)
  view.setUint16(offset, 1, true); offset += 2; // integer PCM
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitDepth, true); offset += 2;

  // 3. data Chunk
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, dataSize, true); offset += 4;

  const channels = Array.from({ length: numChannels }, (_, channel) => buffer.getChannelData(channel));

  if (bitDepth === 16) {
    for (let i = 0; i < length; i++) {
      for (const channel of channels) {
        const sample = Math.max(-1, Math.min(1, channel[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
  } else if (bitDepth === 24) {
    for (let i = 0; i < length; i++) {
      for (const channel of channels) {
        const sample = Math.max(-1, Math.min(1, channel[i]));
        const intValue = sample < 0 ? Math.floor(sample * 0x800000) : Math.floor(sample * 0x7fffff);
        view.setUint8(offset, intValue & 0xff);
        view.setUint8(offset + 1, (intValue >> 8) & 0xff);
        view.setUint8(offset + 2, (intValue >> 16) & 0xff);
        offset += 3;
      }
    }
  }

  offset += dataPad;

  // 4. Append LIST INFO Chunk if present
  if (infoChunkBytes.byteLength > 0) {
    new Uint8Array(outBuffer, offset).set(infoChunkBytes);
  }

  return outBuffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Build a RIFF LIST INFO chunk containing the limited text fields supported here.
 */
function buildRiffInfoChunk(meta: TrackMetadata): Uint8Array {
  const fields: Array<{ tag: string; value: string }> = [];

  if (meta.title) fields.push({ tag: 'INAM', value: meta.title });
  if (meta.artist) fields.push({ tag: 'IART', value: meta.featuredArtists ? `${meta.artist} feat. ${meta.featuredArtists}` : meta.artist });
  if (meta.album) fields.push({ tag: 'IPRD', value: meta.album });
  if (meta.genre) fields.push({ tag: 'IGNR', value: meta.genre });
  if (meta.year) fields.push({ tag: 'ICRD', value: meta.year });
  if (meta.copyright) fields.push({ tag: 'ICOP', value: meta.copyright });
  if (meta.composer) fields.push({ tag: 'IWRI', value: meta.composer });
  if (meta.producer) fields.push({ tag: 'IPRO', value: meta.producer });
  if (meta.masteringEngineer) fields.push({ tag: 'IENG', value: meta.masteringEngineer });
  fields.push({ tag: 'ISFT', value: 'Mastering suite by indiebrotherhood 2026' });
  if (meta.isrc) fields.push({ tag: 'ISRC', value: meta.isrc });
  if (meta.notes) fields.push({ tag: 'ICMT', value: meta.notes });

  if (fields.length === 0) return new Uint8Array(0);

  // Calculate size
  let subChunksSize = 4; // for 'INFO' id
  const subChunkBuffers: Array<{ tag: string; data: Uint8Array; logicalSize: number }> = [];

  for (const f of fields) {
    const textEncoder = new TextEncoder();
    const strBytes = textEncoder.encode(f.value + '\0'); // null-terminated
    const pad = strBytes.length % 2 !== 0 ? 1 : 0;
    const totalBytes = new Uint8Array(strBytes.length + pad);
    totalBytes.set(strBytes);
    subChunkBuffers.push({ tag: f.tag, data: totalBytes, logicalSize: strBytes.length });
    subChunksSize += 8 + totalBytes.length;
  }

  const listChunk = new Uint8Array(8 + subChunksSize);
  const view = new DataView(listChunk.buffer);

  let offset = 0;
  writeString(view, offset, 'LIST'); offset += 4;
  view.setUint32(offset, subChunksSize, true); offset += 4;
  writeString(view, offset, 'INFO'); offset += 4;

  for (const item of subChunkBuffers) {
    writeString(view, offset, item.tag); offset += 4;
    // RIFF chunk sizes exclude the optional even-byte alignment padding.
    view.setUint32(offset, item.logicalSize, true); offset += 4;
    listChunk.set(item.data, offset);
    offset += item.data.byteLength;
  }

  return listChunk;
}
