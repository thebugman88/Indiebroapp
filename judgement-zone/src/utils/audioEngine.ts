import { authenticatedFetch } from '../../../src/services/authService';
// Web Audio Engine & Sound Synthesis for Judgement Zone (IndieBrotherhood 2026)

class AudioEngine {
  private remotePath: string | null = null;
  private playbackRevision = 0;
  private objectUrl: string | null = null;
  private download: AbortController | null = null;
  constructor() {
    if (typeof window !== 'undefined') window.addEventListener('ib_auth_changed', () => {
      this.stop(); this.remotePath = null; this.currentElement = null;
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    });
  }
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | HTMLMediaElement | null = null;
  private currentElement: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private synthInterval: number | null = null;

  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 60;
  private maxListenedTime: number = 0;
  private playbackTimer: number | null = null;
  private onTimeUpdateCallback: ((time: number, maxTime: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onSeekBlockedCallback: ((msg: string) => void) | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.85;
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setVolume(vol: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, vol));
    }
    if (this.currentElement) {
      this.currentElement.volume = Math.max(0, Math.min(1, vol));
    }
  }

  public setCallbacks(
    onTimeUpdate: (time: number, maxTime: number, duration: number) => void,
    onEnded: () => void,
    onSeekBlocked: (msg: string) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
    this.onSeekBlockedCallback = onSeekBlocked;
  }

  public stop() {
    this.playbackRevision++;
    this.download?.abort();
    this.download = null;
    this.isPlaying = false;
    if (this.playbackTimer) {
      window.clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    if (this.synthInterval) {
      window.clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.currentElement) {
      this.currentElement.pause();
      this.currentElement.currentTime = 0;
    }
  }

  public pause() {
    this.playbackRevision++;
    this.download?.abort();
    this.download = null;
    this.isPlaying = false;
    if (this.playbackTimer) {
      window.clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    if (this.synthInterval) {
      window.clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.currentElement) {
      this.currentElement.pause();
    }
  }

  public async play() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    const revision = this.playbackRevision;
    try {
      if (this.remotePath) {
        this.download = new AbortController();
        const response = await authenticatedFetch(this.remotePath, { signal: this.download.signal });
        if (!response.ok) throw new Error('Audio unavailable. Please retry.');
        const blob = await response.blob();
        if (revision !== this.playbackRevision) return;
        this.objectUrl = URL.createObjectURL(blob);
        this.currentElement!.src = this.objectUrl;
        this.remotePath = null;
        this.download = null;
      }
      if (revision !== this.playbackRevision) return;
      if (!this.currentElement?.src) throw new Error('No audio is available for this track.');
      await this.currentElement.play();
      if (revision === this.playbackRevision) this.startTimer();
    } catch {
      if (revision !== this.playbackRevision) return;
      this.isPlaying = false;
      this.onSeekBlockedCallback?.('Audio could not play. Check your connection and retry.');
      this.onEndedCallback?.();
    }
  }

  public loadTrack(audioBlobUrl: string | undefined, durationSeconds: number, synthPreset?: string) {
    this.stop();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.remotePath = audioBlobUrl?.startsWith('/api/judgement/tracks/') ? audioBlobUrl : null;
    this.currentTime = 0;
    this.maxListenedTime = 0;
    this.duration = Math.max(15, durationSeconds || 60);

    if (audioBlobUrl) {
      if (!this.currentElement) {
        this.currentElement = new Audio();
        this.currentElement.crossOrigin = 'anonymous';
      }
      if (this.remotePath) this.currentElement.removeAttribute('src');
      else this.currentElement.src = audioBlobUrl;
      this.currentElement.onended = () => {
        this.isPlaying = false;
        if (this.onEndedCallback) this.onEndedCallback();
      };
      this.currentElement.ontimeupdate = () => {
        if (this.currentElement) {
          this.currentTime = this.currentElement.currentTime;
          if (this.currentTime > this.maxListenedTime) {
            this.maxListenedTime = this.currentTime;
          }
          if (this.onTimeUpdateCallback) {
            this.onTimeUpdateCallback(this.currentTime, this.maxListenedTime, this.duration);
          }
        }
      };
    } else {
      this.currentElement = null;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, 0, this.duration);
    }
  }

  // Rewind by given seconds (Permitted)
  public rewind(seconds: number = 10) {
    const target = Math.max(0, this.currentTime - seconds);
    this.currentTime = target;
    if (this.currentElement) {
      this.currentElement.currentTime = target;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentTime, this.maxListenedTime, this.duration);
    }
  }

  // Attempt seek
  public attemptSeek(targetTime: number) {
    if (targetTime > this.maxListenedTime + 0.5) {
      // FORBIDDEN: Fast forwarding beyond what was listened
      if (this.onSeekBlockedCallback) {
        this.onSeekBlockedCallback('Fast-forwarding is locked in the Judgement Chamber to ensure honest, unbiased evaluations.');
      }
      this.playWarningSound();
      return;
    }

    // Allowed: Seeking backwards or within already listened territory
    this.currentTime = Math.max(0, Math.min(targetTime, this.maxListenedTime));
    if (this.currentElement) {
      this.currentElement.currentTime = this.currentTime;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentTime, this.maxListenedTime, this.duration);
    }
  }

  private startTimer() {
    if (this.playbackTimer) window.clearInterval(this.playbackTimer);
    this.playbackTimer = window.setInterval(() => {
      if (!this.isPlaying) return;
      if (!this.currentElement) {
        // Procedural time increment
        this.currentTime += 0.25;
        if (this.currentTime > this.maxListenedTime) {
          this.maxListenedTime = this.currentTime;
        }
        if (this.currentTime >= this.duration) {
          this.currentTime = this.duration;
          this.isPlaying = false;
          window.clearInterval(this.playbackTimer!);
          if (this.synthInterval) window.clearInterval(this.synthInterval);
          if (this.onEndedCallback) this.onEndedCallback();
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.maxListenedTime, this.duration);
        }
      }
    }, 250);
  }

  // Procedural Web Audio Synth for demo tracks / procedural music stems
  private startProceduralSynth() {
    if (!this.ctx || !this.gainNode) return;
    const ctx = this.ctx;
    const gainNode = this.gainNode;

    // Musical scales for melodic loops
    const baseFreqs = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63]; // C3 to C4
    const chords = [
      [130.81, 164.81, 196.00], // C Maj
      [110.00, 130.81, 164.81], // A Min
      [146.83, 174.61, 220.00], // D Min
      [98.00, 123.47, 146.83]   // G Maj
    ];

    let step = 0;
    if (this.synthInterval) window.clearInterval(this.synthInterval);

    this.synthInterval = window.setInterval(() => {
      if (!this.isPlaying || !ctx || ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      // 1. Kick Drum (Every beat)
      if (step % 4 === 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.35);
        g.gain.setValueAtTime(0.7, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(g);
        g.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.35);
      }

      // 2. Snare / Clap (Step 2 and 6)
      if (step % 8 === 4) {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(filter);
        filter.connect(g);
        g.connect(gainNode);
        noise.start(now);
      }

      // 3. Hi-Hats (Every 8th note)
      if (step % 2 === 0) {
        const bufferSize = ctx.sampleRate * 0.04;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(step % 4 === 2 ? 0.25 : 0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        noise.connect(filter);
        filter.connect(g);
        g.connect(gainNode);
        noise.start(now);
      }

      // 4. Bass 808 Sub
      if (step % 4 === 0) {
        const chordIdx = Math.floor((step % 32) / 8);
        const rootFreq = chords[chordIdx][0] / 2;
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(rootFreq, now);
        bassGain.gain.setValueAtTime(0.5, now);
        bassGain.gain.exponentialRampToValueAtTime(0.05, now + 0.5);
        bassOsc.connect(bassGain);
        bassGain.connect(gainNode);
        bassOsc.start(now);
        bassOsc.stop(now + 0.5);
      }

      // 5. Melodic Arp Synth
      if (Math.random() > 0.2) {
        const chordIdx = Math.floor((step % 32) / 8);
        const chord = chords[chordIdx];
        const note = chord[step % chord.length] * (step % 2 === 0 ? 2 : 1.5);
        const synthOsc = ctx.createOscillator();
        const synthGain = ctx.createGain();
        synthOsc.type = 'triangle';
        synthOsc.frequency.setValueAtTime(note, now);
        synthGain.gain.setValueAtTime(0.2, now);
        synthGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        synthOsc.connect(synthGain);
        synthGain.connect(gainNode);
        synthOsc.start(now);
        synthOsc.stop(now + 0.25);
      }

      step = (step + 1) % 64;
    }, 180); // ~133 BPM 16th feel
  }

  // Sound FX: The Official Gavel Impact of Judgement
  public playGavelImpact() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep sub impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.6);

    // Wooden strike transient
    const strikeOsc = this.ctx.createOscillator();
    const strikeGain = this.ctx.createGain();
    strikeOsc.type = 'triangle';
    strikeOsc.frequency.setValueAtTime(450, now);
    strikeOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    strikeGain.gain.setValueAtTime(0.8, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    strikeOsc.connect(strikeGain);
    strikeGain.connect(this.ctx.destination);
    strikeOsc.start(now);
    strikeOsc.stop(now + 0.15);
  }

  // Sound FX: Success / XP Fanfare
  public playXPChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      g.gain.setValueAtTime(0.3, now + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  // Sound FX: Warning / Seek Denied
  public playWarningSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(120, now + 0.1);
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Sound FX: Curtain Reveal / Unveil
  public playUnveilSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(5000, now + 0.7);

    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }
}

export const audioEngine = new AudioEngine();
