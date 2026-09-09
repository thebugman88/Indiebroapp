import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_LIMITS, detectAudioContainer, isValidIsrc, validateAudioFileHeader, validateAudioFileSize, validateDecodedAudio } from './audioInput';
import { encodeWavBuffer } from './wavEncoder';

const validWav = () => encodeWavBuffer({
  numberOfChannels: 2,
  sampleRate: 48_000,
  length: 2,
  duration: 2 / 48_000,
  getChannelData: () => new Float32Array(2),
} as unknown as AudioBuffer, 24);

test('recognizes supported container signatures and rejects malformed data', () => {
  const wav = validWav();
  assert.equal(detectAudioContainer(new Uint8Array(wav)), 'wav');
  assert.equal(validateAudioFileHeader(wav.byteLength, new Uint8Array(wav)).frames, 2);
  assert.equal(detectAudioContainer(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])), null);
  assert.throws(() => validateAudioFileHeader(12, new Uint8Array(12)), /structurally valid WAV or RF64/);
});

test('enforces input and decoded PCM limits', () => {
  assert.throws(() => validateAudioFileSize(AUDIO_LIMITS.maxFileBytes + 1), /100 MB/);
  assert.throws(() => validateAudioFileHeader(AUDIO_LIMITS.maxFileBytes + 1, new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])), /100 MB/);
  assert.throws(() => validateDecodedAudio({ duration: 1, numberOfChannels: 3, sampleRate: 48_000, length: 1 }), /mono and stereo/);
  assert.throws(() => validateDecodedAudio({ duration: 1, numberOfChannels: 2, sampleRate: 48_000, length: 30_000_000 }), /memory budget/);
});

test('accepts only a valid optional ISRC', () => {
  assert.equal(isValidIsrc(''), true);
  assert.equal(isValidIsrc('US-ABC-26-12345'), true);
  assert.equal(isValidIsrc('US-ABC-26-1234'), false);
  assert.equal(isValidIsrc('NOT AN ISRC'), false);
});
