// Note frequencies & names
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface DetectedPitch {
  frequency: number; // in Hz
  noteName: string; // e.g. "A4"
  noteBase: string; // e.g. "A"
  octave: number; // e.g. 4
  cents: number; // -50 to +50
  clarity: number; // 0 to 1
}

export interface KeyScaleSuggestion {
  root: string;
  mode: 'Major' | 'Minor';
  name: string; // e.g. "C Major"
  confidence: number; // 0 to 100
  notesInScale: string[];
  relativeKey: string;
}

// Convert Hz to pitch info
export function frequencyToPitch(freq: number): DetectedPitch | null {
  if (freq < 20 || freq > 4500) return null;
  const A4 = 440;
  const semitonesFromA4 = 12 * (Math.log(freq / A4) / Math.log(2));
  const midiNote = Math.round(semitonesFromA4) + 69;

  if (midiNote < 12 || midiNote > 127) return null;

  const noteIndex = midiNote % 12;
  const noteBase = NOTE_NAMES[noteIndex];
  const octave = Math.floor(midiNote / 12) - 1;
  const exactNoteFreq = A4 * Math.pow(2, (midiNote - 69) / 12);
  const cents = Math.round(1200 * (Math.log(freq / exactNoteFreq) / Math.log(2)));

  return {
    frequency: Math.round(freq * 10) / 10,
    noteName: `${noteBase}${octave}`,
    noteBase,
    octave,
    cents: Math.max(-50, Math.min(50, cents)),
    clarity: 1,
  };
}

// Autocorrelation algorithm to find fundamental frequency from audio buffer
export function autoCorrelate(buf: Float32Array, sampleRate: number): { freq: number; clarity: number } | null {
  const SIZE = buf.length;
  // Calculate RMS to check if signal is loud enough
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // Too quiet / background noise

  // Trim silence at boundaries
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmedBuf = buf.slice(r1, r2);
  const c = new Float32Array(trimmedBuf.length);

  for (let i = 0; i < trimmedBuf.length; i++) {
    let sum = 0;
    for (let j = 0; j < trimmedBuf.length - i; j++) {
      sum += trimmedBuf[j] * trimmedBuf[j + i];
    }
    c[i] = sum;
  }

  let d = 0;
  while (d < c.length && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;

  for (let i = d; i < c.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  if (maxpos === -1 || maxval <= 0) return null;

  let T0 = maxpos;

  // Parabolic interpolation around peak
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  const freq = sampleRate / T0;
  const clarity = Math.min(1, Math.max(0, maxval / c[0]));

  if (freq >= 40 && freq <= 2000 && clarity > 0.4) {
    return { freq, clarity };
  }

  return null;
}

// Major and Minor Krumhansl-Schmuckler Key Profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

export function getScaleNotes(root: string, mode: 'Major' | 'Minor'): string[] {
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [];
  const intervals = mode === 'Major' ? MAJOR_SCALE_INTERVALS : MINOR_SCALE_INTERVALS;
  return intervals.map((interval) => NOTE_NAMES[(rootIndex + interval) % 12]);
}

export function estimateKeyFromChroma(chroma: number[]): KeyScaleSuggestion[] {
  const results: KeyScaleSuggestion[] = [];

  // Normalize chroma
  const sum = chroma.reduce((a, b) => a + b, 0) || 1;
  const normChroma = chroma.map((v) => v / sum);

  for (let i = 0; i < 12; i++) {
    const rootName = NOTE_NAMES[i];

    // Major correlation
    let dotMajor = 0;
    for (let j = 0; j < 12; j++) {
      dotMajor += normChroma[(i + j) % 12] * MAJOR_PROFILE[j];
    }
    const relMinor = NOTE_NAMES[(i + 9) % 12];
    results.push({
      root: rootName,
      mode: 'Major',
      name: `${rootName} Major`,
      confidence: dotMajor,
      notesInScale: getScaleNotes(rootName, 'Major'),
      relativeKey: `${relMinor} Minor`,
    });

    // Minor correlation
    let dotMinor = 0;
    for (let j = 0; j < 12; j++) {
      dotMinor += normChroma[(i + j) % 12] * MINOR_PROFILE[j];
    }
    const relMajor = NOTE_NAMES[(i + 3) % 12];
    results.push({
      root: rootName,
      mode: 'Minor',
      name: `${rootName} Minor`,
      confidence: dotMinor,
      notesInScale: getScaleNotes(rootName, 'Minor'),
      relativeKey: `${relMajor} Major`,
    });
  }

  // Sort descending
  results.sort((a, b) => b.confidence - a.confidence);

  // Normalize confidences to percentages
  const maxConf = results[0]?.confidence || 1;
  const minConf = results[results.length - 1]?.confidence || 0;
  const range = maxConf - minConf || 1;

  return results.map((item) => ({
    ...item,
    confidence: Math.round(Math.max(15, Math.min(99, ((item.confidence - minConf) / range) * 85 + 15))),
  }));
}

// Analyze AudioBuffer from an uploaded audio file or recorded blob to detect key and scale
export async function analyzeKeyFromAudioBuffer(audioBuffer: AudioBuffer): Promise<{
  topKeys: KeyScaleSuggestion[];
  chromaDistribution: { note: string; energy: number }[];
}> {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // analyze first channel
  const chroma = new Array(12).fill(0);

  const windowSize = 4096;
  const hopSize = 2048;

  // Process windows
  for (let offset = 0; offset + windowSize < channelData.length; offset += hopSize) {
    const slice = channelData.subarray(offset, offset + windowSize);
    const pitch = autoCorrelate(slice, sampleRate);
    if (pitch && pitch.clarity > 0.5) {
      const pInfo = frequencyToPitch(pitch.freq);
      if (pInfo) {
        const noteIdx = NOTE_NAMES.indexOf(pInfo.noteBase);
        if (noteIdx !== -1) {
          chroma[noteIdx] += pitch.clarity;
        }
      }
    }
  }

  const hasPitchData = chroma.some((energy) => energy > 0);
  const topKeys = hasPitchData ? estimateKeyFromChroma(chroma) : [];
  const maxVal = Math.max(...chroma, 1);
  const chromaDistribution = NOTE_NAMES.map((note, idx) => ({
    note,
    energy: Math.round((chroma[idx] / maxVal) * 100),
  }));

  return {
    topKeys: topKeys.slice(0, 5),
    chromaDistribution,
  };
}
