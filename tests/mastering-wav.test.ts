import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeWavBuffer } from '../mastering-suite/src/audio/wavEncoder';
import { validateAudioFileHeader } from '../mastering-suite/src/audio/audioInput';
import type { TrackMetadata } from '../mastering-suite/src/types';

function audioBuffer(channels: number[][], sampleRate = 48_000): AudioBuffer {
  return {
    numberOfChannels: channels.length,
    sampleRate,
    length: channels[0].length,
    duration: channels[0].length / sampleRate,
    getChannelData: (channel: number) => Float32Array.from(channels[channel]),
  } as unknown as AudioBuffer;
}

function text(view: DataView, offset: number, length: number): string {
  return String.fromCharCode(...new Uint8Array(view.buffer, offset, length));
}

function signed24(bytes: Uint8Array, offset: number): number {
  const value = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
  return value & 0x800000 ? value | ~0xffffff : value;
}

function rf64Pcm16Stereo(sampleCount = 1): Uint8Array {
  const bytes = new Uint8Array(84);
  const view = new DataView(bytes.buffer);
  const put = (offset: number, value: string) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  put(0, 'RF64'); view.setUint32(4, 0xffffffff, true); put(8, 'WAVE');
  put(12, 'ds64'); view.setUint32(16, 28, true);
  view.setBigUint64(20, 76n, true); view.setBigUint64(28, 4n, true); view.setBigUint64(36, BigInt(sampleCount), true); view.setUint32(44, 0, true);
  put(48, 'fmt '); view.setUint32(52, 16, true); view.setUint16(56, 1, true); view.setUint16(58, 2, true);
  view.setUint32(60, 48_000, true); view.setUint32(64, 192_000, true); view.setUint16(68, 4, true); view.setUint16(70, 16, true);
  put(72, 'data'); view.setUint32(76, 0xffffffff, true);
  return bytes;
}

const metadata = (overrides: Partial<TrackMetadata> = {}): TrackMetadata => ({
  title: '', artist: '', featuredArtists: '', album: '', trackNumber: '', totalTracks: '', discNumber: '', year: '', genre: '', isrc: '', upc: '', composer: '', producer: '', label: '', copyright: '', phonographicCopyright: '', explicit: false, masteringEngineer: '', notes: '', coverArtUrl: null, coverArtBlob: null, ...overrides,
});

test('16-bit stereo WAV has correct PCM header, sizes, clipping, and interleaving', () => {
  const encoded = encodeWavBuffer(audioBuffer([[-2, 0.5], [2, -0.5]]), 16);
  const view = new DataView(encoded);
  assert.equal(text(view, 0, 4), 'RIFF');
  assert.equal(view.getUint32(4, true), encoded.byteLength - 8);
  assert.equal(text(view, 8, 4), 'WAVE');
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(24, true), 48_000);
  assert.equal(view.getUint16(32, true), 4);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 8);
  assert.deepEqual(Array.from(new Uint8Array(encoded, 44)), [0, 128, 255, 127, 255, 63, 0, 192]);
});

test('24-bit stereo WAV has correct data size and little-endian clipped samples', () => {
  const encoded = encodeWavBuffer(audioBuffer([[-2, 0.5], [2, -0.5]]), 24);
  const view = new DataView(encoded);
  const bytes = new Uint8Array(encoded);
  assert.equal(view.getUint16(32, true), 6);
  assert.equal(view.getUint16(34, true), 24);
  assert.equal(view.getUint32(40, true), 12);
  assert.equal(signed24(bytes, 44), -0x800000);
  assert.equal(signed24(bytes, 47), 0x7fffff);
  assert.equal(signed24(bytes, 50), 0x3fffff);
  assert.equal(signed24(bytes, 53), -0x400000);
});

test('mono WAV writes one sample per frame and a matching header', () => {
  const encoded = encodeWavBuffer(audioBuffer([[0, 1]]), 16);
  const view = new DataView(encoded);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint16(32, true), 2);
  assert.equal(view.getUint32(40, true), 4);
  assert.equal(encoded.byteLength, 48);
});

test('odd-sized 24-bit mono data is padded before following RIFF chunks', () => {
  const encoded = encodeWavBuffer(audioBuffer([[0]]), 24, metadata({ title: 'A' }));
  const view = new DataView(encoded);
  assert.equal(view.getUint32(40, true), 3);
  assert.equal(new Uint8Array(encoded)[47], 0);
  assert.equal(text(view, 48, 4), 'LIST');
  assert.equal(view.getUint32(4, true), encoded.byteLength - 8);
});

test('RIFF INFO sizes are bounded and invalid ISRC never reaches output', () => {
  const encoded = encodeWavBuffer(audioBuffer([[0], [0]]), 24, metadata({ title: 'AB', isrc: 'US-ABC-26-12345' }));
  const view = new DataView(encoded);
  const dataSize = view.getUint32(40, true);
  const listOffset = 44 + dataSize;
  assert.equal(text(view, listOffset, 4), 'LIST');
  assert.equal(view.getUint32(listOffset + 4, true), encoded.byteLength - listOffset - 8);
  assert.equal(text(view, listOffset + 12, 4), 'INAM');
  assert.equal(view.getUint32(listOffset + 16, true), 3, 'INFO size excludes the one-byte RIFF alignment pad');
  assert.throws(() => encodeWavBuffer(audioBuffer([[0], [0]]), 16, metadata({ title: 'x'.repeat(121) })), /120-character/);
  assert.throws(() => encodeWavBuffer(audioBuffer([[0], [0]]), 16, metadata({ isrc: 'INVALID' })), /valid assigned ISRC/);
});

test('pre-decode WAV parser validates declared PCM layout and rejects truncation', () => {
  const encoded = encodeWavBuffer(audioBuffer([[0, 0], [0, 0]]), 24);
  const info = validateAudioFileHeader(encoded.byteLength, new Uint8Array(encoded));
  assert.equal(info.container, 'wav');
  assert.equal(info.channels, 2);
  assert.equal(info.bitDepth, 24);
  assert.equal(info.frames, 2);
  assert.throws(() => validateAudioFileHeader(encoded.byteLength - 1, new Uint8Array(encoded)), /truncated|contradictory/);
  const malformed = encoded.slice(0);
  new DataView(malformed).setUint16(32, 99, true);
  assert.throws(() => validateAudioFileHeader(malformed.byteLength, new Uint8Array(malformed)), /block-alignment/);
});

test('pre-decode RF64 parser requires consistent ds64 sizes and sample count', () => {
  const valid = rf64Pcm16Stereo();
  const info = validateAudioFileHeader(valid.byteLength, valid);
  assert.equal(info.container, 'rf64');
  assert.equal(info.frames, 1);
  assert.throws(() => {
    const contradictory = rf64Pcm16Stereo(2);
    validateAudioFileHeader(contradictory.byteLength, contradictory);
  }, /sample-count declaration/);
});
