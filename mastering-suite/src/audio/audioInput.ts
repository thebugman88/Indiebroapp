export const AUDIO_LIMITS = {
  // Worst case at 48 kHz for five minutes: 100 MB input + 115 MB decoded
  // stereo float PCM + 115 MB forced-stereo offline render + 86 MB 24-bit WAV.
  // Graph overhead remains outside this roughly 416 MB upper-bound estimate.
  maxFileBytes: 100 * 1024 * 1024,
  maxDurationSeconds: 5 * 60,
  maxChannels: 2,
  minSampleRate: 8_000,
  maxSampleRate: 48_000,
  maxFrames: 5 * 60 * 48_000,
  maxDecodedSamples: 5 * 60 * 48_000 * 2,
  maxOfflineStereoSamples: 5 * 60 * 48_000 * 2,
  maxArtworkBytes: 10 * 1024 * 1024,
  maxArtworkDimension: 6_000,
} as const;

export type AudioContainer = 'wav' | 'rf64';

export function validateAudioFileSize(fileSize: number): void {
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > AUDIO_LIMITS.maxFileBytes) {
    throw new Error(`Audio files must be between 1 byte and ${AUDIO_LIMITS.maxFileBytes / 1024 / 1024} MB.`);
  }
}

export interface ValidatedWavInfo {
  container: AudioContainer;
  channels: 1 | 2;
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  encoding: 'pcm' | 'float';
  frames: number;
  duration: number;
  dataBytes: number;
}

const textAt = (bytes: Uint8Array, offset: number, length: number) =>
  String.fromCharCode(...bytes.slice(offset, offset + length));

export function detectAudioContainer(bytes: Uint8Array): AudioContainer | null {
  if (bytes.length < 12) return null;
  if (textAt(bytes, 0, 4) === 'RIFF' && textAt(bytes, 8, 4) === 'WAVE') return 'wav';
  if (textAt(bytes, 0, 4) === 'RF64' && textAt(bytes, 8, 4) === 'WAVE') return 'rf64';
  return null;
}

const safeUint64 = (view: DataView, offset: number): number => {
  const value = view.getBigUint64(offset, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('RF64 declares an unsupported 64-bit size.');
  return Number(value);
};

export function validateAudioFileHeader(fileSize: number, bytes: Uint8Array): ValidatedWavInfo {
  validateAudioFileSize(fileSize);
  const container = detectAudioContainer(bytes);
  if (!container) throw new Error('Only structurally valid WAV or RF64 input is supported.');
  if (bytes.byteLength !== fileSize || bytes.byteLength < 44) throw new Error('WAV container is truncated or its size is contradictory.');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffSize32 = view.getUint32(4, true);
  let declaredRiffSize = riffSize32;
  let rf64DataSize: number | null = null;
  let rf64SampleCount: number | null = null;
  let fmt: { format: number; channels: number; sampleRate: number; byteRate: number; blockAlign: number; bitDepth: number } | null = null;
  let dataBytes: number | null = null;
  let sawDs64 = false;
  let offset = 12;

  while (offset + 8 <= bytes.byteLength) {
    const id = textAt(bytes, offset, 4);
    const size32 = view.getUint32(offset + 4, true);
    const payload = offset + 8;
    let chunkSize = size32;
    if (id === 'ds64') {
      if (sawDs64) throw new Error('RF64 contains duplicate ds64 chunks.');
      if (container !== 'rf64' || size32 < 28 || payload + size32 > bytes.byteLength) throw new Error('Malformed RF64 ds64 chunk.');
      sawDs64 = true;
      declaredRiffSize = safeUint64(view, payload);
      rf64DataSize = safeUint64(view, payload + 8);
      rf64SampleCount = safeUint64(view, payload + 16);
    } else if (id === 'fmt ') {
      if (fmt) throw new Error('WAV contains duplicate fmt chunks.');
      if (size32 < 16 || payload + size32 > bytes.byteLength) throw new Error('Malformed or truncated WAV fmt chunk.');
      fmt = {
        format: view.getUint16(payload, true),
        channels: view.getUint16(payload + 2, true),
        sampleRate: view.getUint32(payload + 4, true),
        byteRate: view.getUint32(payload + 8, true),
        blockAlign: view.getUint16(payload + 12, true),
        bitDepth: view.getUint16(payload + 14, true),
      };
    } else if (id === 'data') {
      if (dataBytes !== null) throw new Error('WAV contains duplicate data chunks.');
      chunkSize = size32 === 0xffffffff && container === 'rf64' && rf64DataSize !== null ? rf64DataSize : size32;
      if (payload + chunkSize > bytes.byteLength) throw new Error('WAV data chunk is truncated or exceeds the container.');
      dataBytes = chunkSize;
    } else if (payload + size32 > bytes.byteLength) {
      throw new Error(`WAV chunk ${id || '(unknown)'} is truncated.`);
    }
    offset = payload + chunkSize + (chunkSize % 2);
  }

  if (container === 'wav' && declaredRiffSize + 8 !== bytes.byteLength) throw new Error('RIFF size does not match the file size.');
  if (container === 'rf64' && (riffSize32 !== 0xffffffff || !sawDs64 || declaredRiffSize + 8 !== bytes.byteLength || rf64DataSize === null || rf64SampleCount === null)) throw new Error('RF64 size declarations are missing or contradictory.');
  if (!fmt || dataBytes === null) throw new Error('WAV requires bounded fmt and data chunks.');
  if (fmt.channels < 1 || fmt.channels > AUDIO_LIMITS.maxChannels) throw new Error('Only mono and stereo WAV input is supported.');
  if (fmt.sampleRate < AUDIO_LIMITS.minSampleRate || fmt.sampleRate > AUDIO_LIMITS.maxSampleRate) throw new Error('WAV sample rate must be between 8 kHz and 48 kHz.');
  const validEncoding = (fmt.format === 1 && (fmt.bitDepth === 16 || fmt.bitDepth === 24)) || (fmt.format === 3 && fmt.bitDepth === 32);
  if (!validEncoding) throw new Error('WAV input must be 16/24-bit PCM or 32-bit IEEE float.');
  const bytesPerSample = fmt.bitDepth / 8;
  const expectedBlockAlign = fmt.channels * bytesPerSample;
  if (fmt.blockAlign !== expectedBlockAlign || fmt.byteRate !== fmt.sampleRate * expectedBlockAlign) throw new Error('WAV format byte-rate or block-alignment fields are contradictory.');
  if (dataBytes <= 0 || dataBytes % expectedBlockAlign !== 0) throw new Error('WAV data length is not aligned to complete audio frames.');
  const frames = dataBytes / expectedBlockAlign;
  if (container === 'rf64' && rf64SampleCount !== frames) throw new Error('RF64 sample-count declaration contradicts its audio data.');
  const duration = frames / fmt.sampleRate;
  if (frames > AUDIO_LIMITS.maxFrames || duration > AUDIO_LIMITS.maxDurationSeconds) throw new Error('WAV input exceeds the five-minute frame or duration limit.');
  if (frames * fmt.channels > AUDIO_LIMITS.maxDecodedSamples || frames * 2 > AUDIO_LIMITS.maxOfflineStereoSamples) throw new Error('WAV input exceeds the decoded/offline PCM memory budget.');
  return {
    container,
    channels: fmt.channels as 1 | 2,
    sampleRate: fmt.sampleRate,
    bitDepth: fmt.bitDepth as 16 | 24 | 32,
    encoding: fmt.format === 3 ? 'float' : 'pcm',
    frames,
    duration,
    dataBytes,
  };
}

export function validateDecodedAudio(info: { duration: number; numberOfChannels: number; sampleRate: number; length: number }, declared?: ValidatedWavInfo): void {
  if (!Number.isFinite(info.duration) || info.duration <= 0 || info.duration > AUDIO_LIMITS.maxDurationSeconds) throw new Error('Decoded audio duration exceeds the five-minute limit.');
  if (!Number.isInteger(info.numberOfChannels) || info.numberOfChannels < 1 || info.numberOfChannels > AUDIO_LIMITS.maxChannels) throw new Error('Only mono and stereo audio are supported.');
  if (!Number.isFinite(info.sampleRate) || info.sampleRate < AUDIO_LIMITS.minSampleRate || info.sampleRate > AUDIO_LIMITS.maxSampleRate) throw new Error('Sample rate must be between 8 kHz and 48 kHz.');
  if (!Number.isInteger(info.length) || info.length <= 0 || info.length * info.numberOfChannels > AUDIO_LIMITS.maxDecodedSamples) throw new Error('Decoded PCM data exceeds the safe memory budget.');
  if (info.length * 2 > AUDIO_LIMITS.maxOfflineStereoSamples) throw new Error('Forced-stereo offline rendering exceeds the safe memory budget.');
  if (declared && (info.numberOfChannels !== declared.channels || info.sampleRate !== declared.sampleRate || Math.abs(info.length - declared.frames) > 1)) throw new Error('Decoded audio contradicts the validated WAV header.');
}

export function isValidIsrc(value: string): boolean {
  return value === '' || /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(value.replace(/[-\s]/g, '').toUpperCase());
}

export function normalizeIsrc(value: string): string {
  const compact = value.replace(/[-\s]/g, '').toUpperCase();
  return compact.length === 12 ? `${compact.slice(0, 2)}-${compact.slice(2, 5)}-${compact.slice(5, 7)}-${compact.slice(7)}` : value;
}

export function validateArtworkFile(file: File): void {
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Artwork must be a JPEG or PNG image.');
  if (file.size <= 0 || file.size > AUDIO_LIMITS.maxArtworkBytes) throw new Error('Artwork must be no larger than 10 MB.');
}

export function imageDimensionsFromHeader(bytes: Uint8Array): { width: number; height: number } | null {
  const isPng = bytes.length >= 24
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
    && textAt(bytes, 12, 4) === 'IHDR';
  if (isPng) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  for (let i = 2; i + 9 < bytes.length;) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    const length = (bytes[i + 2] << 8) + bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length) return null;
    if (marker >= 0xc0 && marker <= 0xc3) return { height: (bytes[i + 5] << 8) + bytes[i + 6], width: (bytes[i + 7] << 8) + bytes[i + 8] };
    i += 2 + length;
  }
  return null;
}

export function validateArtworkDimensions(dimensions: { width: number; height: number } | null): void {
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > AUDIO_LIMITS.maxArtworkDimension || dimensions.height > AUDIO_LIMITS.maxArtworkDimension) throw new Error('Artwork dimensions must be between 1 and 6000 pixels.');
}
