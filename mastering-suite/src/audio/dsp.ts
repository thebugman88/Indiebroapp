import { MasteringPreset, AudioMetrics } from '../types';

/**
 * Generate a specialized distortion curve for Sonic HD saturation models
 */
export function makeDistortionCurve(mode: 'tube' | 'tape' | 'console' | 'solid-state', driveAmount: number, warmth: number): Float32Array {
  const n_samples = 4096;
  const curve = new Float32Array(n_samples);
  const k = (driveAmount / 100) * 8 + 0.001;
  const w = warmth / 100;

  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;

    if (mode === 'tube') {
      // Asymmetric soft saturation with rich even harmonics
      if (x < -1) {
        curve[i] = -1;
      } else if (x > 1) {
        curve[i] = 1;
      } else {
        const asym = x + 0.15 * w * (x * x - 1);
        curve[i] = Math.tanh(asym * (1 + k));
      }
    } else if (mode === 'tape') {
      // Symmetrical hysteresis and smooth high-frequency rounding
      const norm = Math.sin((Math.PI / 2) * Math.max(-1, Math.min(1, x * (1 + k * 0.8))));
      curve[i] = 0.85 * norm + 0.15 * Math.tanh(x * 2.5);
    } else if (mode === 'console') {
      // Discrete transformer saturation - punchy with subtle 3rd harmonic
      const softClip = (3 * x / 2) * (1 - (x * x) / 3);
      const clamped = Math.max(-1, Math.min(1, softClip));
      curve[i] = (1 - (k * 0.1)) * x + (k * 0.1) * clamped;
    } else {
      // Solid-State: Clean precision with slight fast transient rounding
      if (Math.abs(x) < 0.6) {
        curve[i] = x * (1 + k * 0.2);
      } else {
        const sign = x > 0 ? 1 : -1;
        curve[i] = sign * (0.6 + 0.4 * Math.tanh((Math.abs(x) - 0.6) * (1 + k)));
      }
    }
  }
  return curve;
}

/**
 * Generate sub-harmonic distortion curve
 */
export function makeSubHarmonicCurve(): Float32Array {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    // Octave generator (even harmonic rectified blend)
    curve[i] = Math.sin(x * Math.PI * 0.5) + 0.3 * (Math.abs(x) - 0.5);
  }
  return curve;
}

/**
 * Generate a short synthetic room impulse response buffer.
 */
export function createSyntheticSpatialImpulse(ctx: BaseAudioContext, duration = 0.12, decay = 3.5): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-decay * t);
    // Slightly different left/right signals create a synthetic room texture.
    const noiseL = (Math.random() * 2 - 1) * env;
    const noiseR = (Math.random() * 2 - 1) * env;
    const phaseShift = Math.sin(t * 800) * 0.2;
    left[i] = noiseL * 0.8 + phaseShift * 0.1;
    right[i] = noiseR * 0.8 - phaseShift * 0.1;
  }
  return impulse;
}

export interface MasteringNodes {
  inputNode: GainNode;
  outputNode: GainNode;
  analyserL: AnalyserNode;
  analyserR: AnalyserNode;
  analyserPost: AnalyserNode;
  bypassGain: GainNode;
  wetGain: GainNode;
  limiterNode: DynamicsCompressorNode;
  dispose: () => void;
  setBypass: (bypass: boolean) => void;
  updateSettings: (preset: MasteringPreset) => void;
}

/**
 * Builds the complete Mastering DSP Graph in any AudioContext / OfflineAudioContext
 */
export function buildMasteringDspGraph(
  ctx: BaseAudioContext,
  preset: MasteringPreset
): MasteringNodes {
  const inputNode = ctx.createGain();
  const outputNode = ctx.createGain();

  // Dry / Bypass crossfade
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 0;
  wetGain.gain.value = 1;

  inputNode.connect(dryGain);
  dryGain.connect(outputNode);

  // Input gain stage
  const inputGain = ctx.createGain();
  inputGain.gain.value = Math.pow(10, preset.loudness.inputGainDb / 20);
  inputNode.connect(inputGain);

  const cleanupDryGain = ctx.createGain();
  const cleanupWetGain = ctx.createGain();
  cleanupDryGain.gain.value = preset.cleanup.enabled ? 0 : 1;
  cleanupWetGain.gain.value = preset.cleanup.enabled ? 1 : 0;
  inputGain.connect(cleanupDryGain);

  // --- STAGE 1: CLEANUP ---
  // Sub Rumble High Pass
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = preset.cleanup.highPassFreq;
  hpFilter.Q.value = 0.707;

  // 50Hz Mains De-Hum Notch
  const notch50 = ctx.createBiquadFilter();
  notch50.type = 'notch';
  notch50.frequency.value = 50;
  notch50.Q.value = preset.cleanup.deHum ? 12 : 0.001;

  // 60Hz Mains De-Hum Notch
  const notch60 = ctx.createBiquadFilter();
  notch60.type = 'notch';
  notch60.frequency.value = 60;
  notch60.Q.value = preset.cleanup.deHum ? 12 : 0.001;

  // De-Harsh Dynamic Sibilance Filter (6.5kHz notch/peaking)
  const deHarshFilter = ctx.createBiquadFilter();
  deHarshFilter.type = 'peaking';
  deHarshFilter.frequency.value = 6800;
  deHarshFilter.Q.value = 2.5;
  deHarshFilter.gain.value = preset.cleanup.deHarsh ? -(preset.cleanup.deHarshAmount * 0.06) : 0;

  // Ultrasonic Low Pass Filter
  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = preset.cleanup.lowPassFreq;
  lpFilter.Q.value = 0.707;

  inputGain.connect(hpFilter);
  hpFilter.connect(notch50);
  notch50.connect(notch60);
  notch60.connect(deHarshFilter);
  deHarshFilter.connect(lpFilter);
  lpFilter.connect(cleanupWetGain);
  const cleanupSum = ctx.createGain();
  cleanupDryGain.connect(cleanupSum);
  cleanupWetGain.connect(cleanupSum);

  // --- STAGE 2: BASS BOOST & SUB DYNAMICS ---
  const subEq = ctx.createBiquadFilter();
  subEq.type = 'lowshelf';
  subEq.frequency.value = preset.bass.subFreq;
  subEq.gain.value = preset.bass.enabled ? preset.bass.subBoostDb : 0;

  const punchEq = ctx.createBiquadFilter();
  punchEq.type = 'peaking';
  punchEq.frequency.value = 115;
  punchEq.Q.value = 1.6;
  punchEq.gain.value = preset.bass.enabled ? preset.bass.punchDb : 0;

  // Sub Harmonics parallel branch
  const subHarmonicFilter = ctx.createBiquadFilter();
  subHarmonicFilter.type = 'lowpass';
  subHarmonicFilter.frequency.value = 90;

  const subHarmonicShaper = ctx.createWaveShaper();
  subHarmonicShaper.curve = makeSubHarmonicCurve();
  subHarmonicShaper.oversample = '2x';

  const subHarmonicGain = ctx.createGain();
  subHarmonicGain.gain.value = preset.bass.enabled ? (preset.bass.subHarmonics / 100) * 0.35 : 0;

  cleanupSum.connect(subEq);
  subEq.connect(punchEq);

  // Branch into sub-harmonic generator
  cleanupSum.connect(subHarmonicFilter);
  subHarmonicFilter.connect(subHarmonicShaper);
  subHarmonicShaper.connect(subHarmonicGain);

  const bassSumNode = ctx.createGain();
  punchEq.connect(bassSumNode);
  subHarmonicGain.connect(bassSumNode);

  // --- STAGE 3: CLARITY, PRESENCE & AIR ---
  const airEq = ctx.createBiquadFilter();
  airEq.type = 'highshelf';
  airEq.frequency.value = 12500;
  airEq.gain.value = preset.clarity.enabled ? preset.clarity.airDb : 0;

  const presenceEq = ctx.createBiquadFilter();
  presenceEq.type = 'peaking';
  presenceEq.frequency.value = 4200;
  presenceEq.Q.value = 1.4;
  presenceEq.gain.value = preset.clarity.enabled ? preset.clarity.presenceDb : 0;

  const vocalShineEq = ctx.createBiquadFilter();
  vocalShineEq.type = 'peaking';
  vocalShineEq.frequency.value = 2800;
  vocalShineEq.Q.value = 1.8;
  vocalShineEq.gain.value = preset.clarity.enabled ? (preset.clarity.vocalShine / 100) * 2.5 : 0;

  bassSumNode.connect(airEq);
  airEq.connect(presenceEq);
  presenceEq.connect(vocalShineEq);

  // --- STAGE 4: SONIC HD SATURATION & ANALOG GLUE ---
  const saturator = ctx.createWaveShaper();
  saturator.curve = makeDistortionCurve(preset.sonicHd.mode, preset.sonicHd.drive, preset.sonicHd.warmth);
  saturator.oversample = '4x';

  // Analog Tape / Tube warmth Low-pass softening
  const warmthFilter = ctx.createBiquadFilter();
  warmthFilter.type = 'lowshelf';
  warmthFilter.frequency.value = 250;
  warmthFilter.gain.value = preset.sonicHd.enabled ? (preset.sonicHd.warmth / 100) * 2.0 : 0;

  // Analog Bus Glue Compressor
  const glueComp = ctx.createDynamicsCompressor();
  glueComp.threshold.value = -18 - (preset.sonicHd.analogGlue * 0.12);
  glueComp.knee.value = 12;
  glueComp.ratio.value = 2.0 + (preset.sonicHd.analogGlue * 0.03);
  glueComp.attack.value = 0.03; // 30ms transparent punch
  glueComp.release.value = 0.12; // 120ms smooth release

  const sonicDryGain = ctx.createGain();
  const sonicWetGain = ctx.createGain();
  sonicDryGain.gain.value = preset.sonicHd.enabled ? 0 : 1;
  sonicWetGain.gain.value = preset.sonicHd.enabled ? 1 : 0;
  vocalShineEq.connect(sonicDryGain);
  vocalShineEq.connect(warmthFilter);
  warmthFilter.connect(saturator);
  saturator.connect(glueComp);
  glueComp.connect(sonicWetGain);
  const sonicSum = ctx.createGain();
  sonicDryGain.connect(sonicSum);
  sonicWetGain.connect(sonicSum);

  // --- STAGE 5: SPATIAL IMAGING & SYNTHETIC ROOM TEXTURE ---
  // Mid/Side separation
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  // Left and Right isolation
  const midSum = ctx.createGain(); // (L + R) * 0.5
  midSum.gain.value = 0.5;

  const sideDiffL = ctx.createGain(); // +0.5 * L
  sideDiffL.gain.value = 0.5;
  const sideDiffR = ctx.createGain(); // -0.5 * R
  sideDiffR.gain.value = -0.5;
  const sideSum = ctx.createGain();

  sonicSum.connect(splitter);
  splitter.connect(midSum, 0);
  splitter.connect(midSum, 1);

  splitter.connect(sideDiffL, 0);
  splitter.connect(sideDiffR, 1);
  sideDiffL.connect(sideSum);
  sideDiffR.connect(sideSum);

  // Width Multipliers
  const widthFactor = preset.spatial.enabled ? preset.spatial.stereoWidth / 100 : 1.0;
  const midGain = ctx.createGain();
  const sideGain = ctx.createGain();

  // Mono bass below threshold: Highpass on Side signal
  const sideHpFilter = ctx.createBiquadFilter();
  sideHpFilter.type = 'highpass';
  sideHpFilter.frequency.value = preset.bass.enabled && preset.bass.monoBelowFreq > 0 ? preset.bass.monoBelowFreq : 0;

  midGain.gain.value = 1.0;
  sideGain.gain.value = widthFactor;

  midSum.connect(midGain);
  sideSum.connect(sideHpFilter);
  sideHpFilter.connect(sideGain);

  // Re-encode into L and R: L = Mid + Side, R = Mid - Side
  const lReconMid = ctx.createGain();
  const lReconSide = ctx.createGain();
  const rReconMid = ctx.createGain();
  const rReconSide = ctx.createGain();

  lReconMid.gain.value = 1.0;
  lReconSide.gain.value = 1.0;
  rReconMid.gain.value = 1.0;
  rReconSide.gain.value = -1.0;

  midGain.connect(lReconMid);
  sideGain.connect(lReconSide);
  midGain.connect(rReconMid);
  sideGain.connect(rReconSide);

  const leftMaster = ctx.createGain();
  const rightMaster = ctx.createGain();

  lReconMid.connect(leftMaster);
  lReconSide.connect(leftMaster);
  rReconMid.connect(rightMaster);
  rReconSide.connect(rightMaster);

  // Optional synthetic room texture (not a surround or HRTF encoder).
  const convolver = ctx.createConvolver();
  convolver.buffer = createSyntheticSpatialImpulse(ctx, 0.15, 4.0);

  const spatialWetGain = ctx.createGain();
  const isSurroundMode = preset.spatial.enabled && preset.spatial.mode === 'synthetic-room';
  spatialWetGain.gain.value = isSurroundMode ? (preset.spatial.surroundSpread / 100) * 0.32 : 0;

  leftMaster.connect(merger, 0, 0);
  rightMaster.connect(merger, 0, 1);

  leftMaster.connect(convolver);
  rightMaster.connect(convolver);
  convolver.connect(spatialWetGain);

  const postSpatialSum = ctx.createGain();
  merger.connect(postSpatialSum);
  spatialWetGain.connect(postSpatialSum);

  // --- STAGE 6: MASTER BRICKWALL LIMITER & LOUDNESS CEILING ---
  const masterLimiter = ctx.createDynamicsCompressor();
  const ceilingDb = preset.loudness.ceilingDb; // e.g. -1.0 dB

  // High-ratio brickwall limiter
  masterLimiter.threshold.value = ceilingDb - 0.2;
  masterLimiter.knee.value = 0.0;
  masterLimiter.ratio.value = 20.0;
  masterLimiter.attack.value = 0.001; // 1ms ultra-fast brickwall response
  masterLimiter.release.value = Math.max(0.01, preset.loudness.limiterRelease / 1000);

  postSpatialSum.connect(masterLimiter);

  // Output Ceiling Gain Stage
  const ceilingGain = ctx.createGain();
  ceilingGain.gain.value = Math.pow(10, ceilingDb / 20);
  masterLimiter.connect(ceilingGain);

  ceilingGain.connect(wetGain);
  wetGain.connect(outputNode);

  // --- METERS & ANALYSERS ---
  const analyserL = ctx.createAnalyser();
  analyserL.fftSize = 2048;
  analyserL.smoothingTimeConstant = 0.8;

  const analyserR = ctx.createAnalyser();
  analyserR.fftSize = 2048;
  analyserR.smoothingTimeConstant = 0.8;

  const analyserPost = ctx.createAnalyser();
  analyserPost.fftSize = 2048;
  analyserPost.smoothingTimeConstant = 0.82;

  const postSplitter = ctx.createChannelSplitter(2);
  outputNode.connect(postSplitter);
  outputNode.connect(analyserPost);
  postSplitter.connect(analyserL, 0);
  postSplitter.connect(analyserR, 1);

  // Bypass Controller
  const setBypass = (bypass: boolean) => {
    if (bypass) {
      dryGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.015);
      wetGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.015);
    } else {
      dryGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.015);
      wetGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.015);
    }
  };

  const disposableNodes: AudioNode[] = [
    inputNode, outputNode, dryGain, wetGain, inputGain, cleanupDryGain, cleanupWetGain,
    hpFilter, notch50, notch60, deHarshFilter, lpFilter, cleanupSum, subEq, punchEq,
    subHarmonicFilter, subHarmonicShaper, subHarmonicGain, bassSumNode, airEq,
    presenceEq, vocalShineEq, saturator, warmthFilter, glueComp, sonicDryGain,
    sonicWetGain, sonicSum, splitter, merger, midSum, sideDiffL, sideDiffR, sideSum,
    midGain, sideGain, sideHpFilter, lReconMid, lReconSide, rReconMid, rReconSide,
    leftMaster, rightMaster, convolver, spatialWetGain, postSpatialSum, masterLimiter,
    ceilingGain, analyserL, analyserR, analyserPost, postSplitter,
  ];
  const dispose = () => {
    for (const node of disposableNodes) {
      try { node.disconnect(); } catch { /* already disconnected */ }
    }
  };

  // Dynamic Parameter Updater
  const updateSettings = (p: MasteringPreset) => {
    const t = ctx.currentTime;
    inputGain.gain.setTargetAtTime(Math.pow(10, p.loudness.inputGainDb / 20), t, 0.02);

    // Cleanup
    cleanupDryGain.gain.setTargetAtTime(p.cleanup.enabled ? 0 : 1, t, 0.02);
    cleanupWetGain.gain.setTargetAtTime(p.cleanup.enabled ? 1 : 0, t, 0.02);
    hpFilter.frequency.setTargetAtTime(p.cleanup.highPassFreq, t, 0.02);
    notch50.Q.setTargetAtTime(p.cleanup.deHum ? 12 : 0.001, t, 0.02);
    notch60.Q.setTargetAtTime(p.cleanup.deHum ? 12 : 0.001, t, 0.02);
    deHarshFilter.gain.setTargetAtTime(p.cleanup.deHarsh ? -(p.cleanup.deHarshAmount * 0.06) : 0, t, 0.02);
    lpFilter.frequency.setTargetAtTime(p.cleanup.lowPassFreq, t, 0.02);

    // Bass
    subEq.frequency.setTargetAtTime(p.bass.subFreq, t, 0.02);
    subEq.gain.setTargetAtTime(p.bass.enabled ? p.bass.subBoostDb : 0, t, 0.02);
    punchEq.gain.setTargetAtTime(p.bass.enabled ? p.bass.punchDb : 0, t, 0.02);
    subHarmonicGain.gain.setTargetAtTime(p.bass.enabled ? (p.bass.subHarmonics / 100) * 0.35 : 0, t, 0.02);
    sideHpFilter.frequency.setTargetAtTime(p.bass.enabled && p.bass.monoBelowFreq > 0 ? p.bass.monoBelowFreq : 0, t, 0.02);

    // Clarity
    airEq.gain.setTargetAtTime(p.clarity.enabled ? p.clarity.airDb : 0, t, 0.02);
    presenceEq.gain.setTargetAtTime(p.clarity.enabled ? p.clarity.presenceDb : 0, t, 0.02);
    vocalShineEq.gain.setTargetAtTime(p.clarity.enabled ? (p.clarity.vocalShine / 100) * 2.5 : 0, t, 0.02);

    // Sonic HD
    sonicDryGain.gain.setTargetAtTime(p.sonicHd.enabled ? 0 : 1, t, 0.02);
    sonicWetGain.gain.setTargetAtTime(p.sonicHd.enabled ? 1 : 0, t, 0.02);
    saturator.curve = makeDistortionCurve(p.sonicHd.mode, p.sonicHd.drive, p.sonicHd.warmth);
    warmthFilter.gain.setTargetAtTime(p.sonicHd.enabled ? (p.sonicHd.warmth / 100) * 2.0 : 0, t, 0.02);
    glueComp.threshold.setTargetAtTime(-18 - (p.sonicHd.analogGlue * 0.12), t, 0.02);
    glueComp.ratio.setTargetAtTime(2.0 + (p.sonicHd.analogGlue * 0.03), t, 0.02);

    // Spatial
    sideGain.gain.setTargetAtTime(p.spatial.enabled ? p.spatial.stereoWidth / 100 : 1.0, t, 0.02);
    const isSurround = p.spatial.enabled && p.spatial.mode === 'synthetic-room';
    spatialWetGain.gain.setTargetAtTime(isSurround ? (p.spatial.surroundSpread / 100) * 0.32 : 0, t, 0.02);

    // Limiter
    masterLimiter.threshold.setTargetAtTime(p.loudness.ceilingDb - 0.2, t, 0.02);
    masterLimiter.release.setTargetAtTime(Math.max(0.01, p.loudness.limiterRelease / 1000), t, 0.02);
    ceilingGain.gain.setTargetAtTime(Math.pow(10, p.loudness.ceilingDb / 20), t, 0.02);
  };

  return {
    inputNode,
    outputNode,
    analyserL,
    analyserR,
    analyserPost,
    bypassGain: dryGain,
    wetGain,
    limiterNode: masterLimiter,
    dispose,
    setBypass,
    updateSettings,
  };
}

/**
 * Offline render an AudioBuffer through the mastering DSP chain
 */
export async function renderMasterOffline(
  sourceBuffer: AudioBuffer,
  preset: MasteringPreset,
  onProgress?: (pct: number) => void
): Promise<AudioBuffer> {
  const sampleRate = sourceBuffer.sampleRate;
  const length = sourceBuffer.length;
  const channels = 2;

  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate);

  // Create source buffer node
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = sourceBuffer;

  // Build mastering graph
  const nodes = buildMasteringDspGraph(offlineCtx, preset);
  sourceNode.connect(nodes.inputNode);
  nodes.outputNode.connect(offlineCtx.destination);

  sourceNode.start(0);

  try {
    const renderedBuffer = await offlineCtx.startRendering();
    if (onProgress) onProgress(100);
    return renderedBuffer;
  } finally {
    try { sourceNode.disconnect(); } catch { /* already disconnected */ }
    nodes.dispose();
  }
}

/**
 * Calculate input RMS, sample peak, correlation, and rough level estimates.
 */
export function analyzeAudioBuffer(buffer: AudioBuffer): AudioMetrics {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;

  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : left;

  let sumSquaresL = 0;
  let sumSquaresR = 0;
  let peakL = 0;
  let peakR = 0;
  let phaseNumerator = 0;
  let phaseDenomL = 0;
  let phaseDenomR = 0;

  // Step for fast accurate calculation across large tracks
  const step = Math.max(1, Math.floor(length / 250000));
  let count = 0;

  for (let i = 0; i < length; i += step) {
    const l = left[i];
    const r = right[i];

    sumSquaresL += l * l;
    sumSquaresR += r * r;

    const absL = Math.abs(l);
    const absR = Math.abs(r);
    if (absL > peakL) peakL = absL;
    if (absR > peakR) peakR = absR;

    phaseNumerator += l * r;
    phaseDenomL += l * l;
    phaseDenomR += r * r;
    count++;
  }

  const rmsL = Math.sqrt(sumSquaresL / count);
  const rmsR = Math.sqrt(sumSquaresR / count);
  const overallRms = Math.sqrt((sumSquaresL + sumSquaresR) / (2 * count));

  // K-weighting approximation for LUFS
  const approxLufs = overallRms > 0.00001 ? 20 * Math.log10(overallRms) - 0.691 : -70;
  const truePeakDb = Math.max(peakL, peakR) > 0.00001 ? 20 * Math.log10(Math.max(peakL, peakR)) : -70;

  const denom = Math.sqrt(phaseDenomL * phaseDenomR);
  const correlation = denom > 0.00001 ? Math.max(-1, Math.min(1, phaseNumerator / denom)) : 1.0;
  const dynamicRange = Math.max(0, truePeakDb - approxLufs);

  return {
    currentLUFS: parseFloat(approxLufs.toFixed(1)),
    shortTermLUFS: parseFloat(approxLufs.toFixed(1)),
    integratedLUFS: parseFloat(approxLufs.toFixed(1)),
    truePeakDb: parseFloat(truePeakDb.toFixed(2)),
    peakL: parseFloat(peakL.toFixed(3)),
    peakR: parseFloat(peakR.toFixed(3)),
    rmsL: parseFloat(rmsL.toFixed(3)),
    rmsR: parseFloat(rmsR.toFixed(3)),
    phaseCorrelation: parseFloat(correlation.toFixed(2)),
    dynamicRangePLR: parseFloat(dynamicRange.toFixed(1)),
  };
}
