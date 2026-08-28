import { AudioAnalysisResult } from '../types';

export const STREAMING_TARGETS = [
  { id: 'spotify', name: 'Spotify / YouTube / Tidal', targetLufs: -14.0, description: 'Standard streaming normalization' },
  { id: 'apple', name: 'Apple Music (Sound Check)', targetLufs: -16.0, description: 'Apple Music default target' },
  { id: 'club', name: 'Club / EDM / Commercial Master', targetLufs: -9.0, description: 'Loud, competitive club master' },
  { id: 'broadcast', name: 'EBU R128 / TV Broadcast', targetLufs: -23.0, description: 'Broadcast standard target' },
];

export async function analyzeAudioFile(
  file: File,
  targetLufs: number = -14.0
): Promise<AudioAnalysisResult> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    let maxSample = 0;
    let sumSquared = 0;
    let totalSamples = 0;

    // Peak waveform generation (120 points for sleek UI)
    const waveformPoints = 120;
    const peakWaveform: number[] = new Array(waveformPoints).fill(0);
    const blockSize = Math.floor(audioBuffer.length / waveformPoints);

    // K-weighting high shelf filter approximation for estimated loudness
    // Stage 1: Pre-filter (high shelf ~ +4dB at high frequencies)
    // Stage 2: RLB weighting (high-pass ~ 100Hz)
    let filteredPowerSum = 0;
    let filteredSampleCount = 0;

    for (let c = 0; c < numChannels; c++) {
      const channelData = audioBuffer.getChannelData(c);
      totalSamples += channelData.length;

      // Filter state
      let x1 = 0;
      let x2 = 0;
      let y1 = 0;
      let y2 = 0;

      // Approximate coefficients; this is an estimate rather than full BS.1770.
      const b0 = 1.53512485958697;
      const b1 = -2.69169618940638;
      const b2 = 1.19839281085285;
      const a1 = -1.69065929318241;
      const a2 = 0.73248077421585;

      for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i];
        const abs = Math.abs(sample);
        if (abs > maxSample) maxSample = abs;
        sumSquared += sample * sample;

        // Waveform bin
        const waveIdx = Math.min(waveformPoints - 1, Math.floor(i / blockSize));
        if (abs > peakWaveform[waveIdx]) {
          peakWaveform[waveIdx] = abs;
        }

        // K-weight filter step
        const yn = b0 * sample + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1;
        x1 = sample;
        y2 = y1;
        y1 = yn;

        // Sample every 4th sample for speed in long tracks
        if (i % 4 === 0) {
          filteredPowerSum += yn * yn;
          filteredSampleCount++;
        }
      }
    }

    // Peak dBFS
    const peakDbfs = maxSample > 0 ? 20 * Math.log10(maxSample) : -99.9;
    const isClipping = peakDbfs >= -0.1;

    // RMS dBFS
    const rms = Math.sqrt(sumSquared / (totalSamples || 1));
    const rmsDbfs = rms > 0 ? 20 * Math.log10(rms) : -99.9;

    // Estimated Integrated LUFS
    const meanSquareFiltered = filteredPowerSum / (filteredSampleCount || 1);
    let estimatedLufs = -0.691 + 10 * Math.log10(meanSquareFiltered + 1e-12);
    if (!isFinite(estimatedLufs) || estimatedLufs < -70) {
      estimatedLufs = -70;
    }

    // Gain adjustment needed to hit target
    const gainAdjustmentDb = Math.round((targetLufs - estimatedLufs) * 10) / 10;

    return {
      fileName: file.name,
      fileSize: file.size,
      duration: Math.round(duration * 100) / 100,
      sampleRate,
      numberOfChannels: numChannels,
      peakDbfs: Math.round(peakDbfs * 10) / 10,
      rmsDbfs: Math.round(rmsDbfs * 10) / 10,
      estimatedLufs: Math.round(estimatedLufs * 10) / 10,
      targetLufs,
      gainAdjustmentDb,
      isClipping,
      peakWaveform,
    };
  } finally {
    audioContext.close();
  }
}
