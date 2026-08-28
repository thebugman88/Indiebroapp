// Web Audio API Synthesizer for generating copyright-free, 100% playable audio snippets
// Works on all devices without external API keys or external server hosting.

class SonicSynthEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play a 5-second energetic musical snippet based on genre
   * Returns a stop function
   */
  public playSnippet(genre: string = 'pop', onEnd?: () => void): () => void {
    try {
      this.initCtx();
      if (!this.ctx) return () => {};

      const now = this.ctx.currentTime;
      const duration = 5.0; // 5 seconds snippet

      // Master Gain
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      masterGain.connect(this.ctx.destination);

      const activeNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];

      // Notes frequencies depending on genre
      let melodyNotes = [261.63, 329.63, 392.00, 523.25]; // C E G C
      let bassFreq = 130.81;

      if (genre.includes('hip_hop') || genre.includes('rap')) {
        melodyNotes = [146.83, 174.61, 220.00, 164.81]; // D F A E
        bassFreq = 65.41; // Heavy sub bass
      } else if (genre.includes('rock')) {
        melodyNotes = [164.81, 196.00, 246.94, 329.63]; // E G B E
        bassFreq = 82.41;
      } else if (genre.includes('edm')) {
        melodyNotes = [349.23, 440.00, 523.25, 698.46]; // F A C F
        bassFreq = 87.31;
      }

      // 1. Bassline synth
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = genre.includes('hip_hop') ? 'sine' : 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.4, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(now);
      bassOsc.stop(now + duration);
      activeNodes.push(bassOsc);

      // 2. Arpeggiated / Melody note sequence over 5 seconds
      const noteDuration = 0.3;
      const totalSteps = Math.floor(duration / noteDuration);

      for (let i = 0; i < totalSteps; i++) {
        const noteTime = now + (i * noteDuration);
        const freq = melodyNotes[i % melodyNotes.length];

        const osc = this.ctx.createOscillator();
        osc.type = genre.includes('rock') ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration - 0.05);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + noteDuration);
        activeNodes.push(osc);
      }

      // Trigger end callback when done
      const timer = setTimeout(() => {
        if (onEnd) onEnd();
      }, duration * 1000);

      return () => {
        clearTimeout(timer);
        activeNodes.forEach(node => {
          try { node.stop(); } catch {}
        });
      };
    } catch (e) {
      console.error('Audio synth error:', e);
      if (onEnd) onEnd();
      return () => {};
    }
  }

  /**
   * Play simple success sound effect
   */
  public playSuccessSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Play error sound effect
   */
  public playErrorSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.error(e);
    }
  }
}

export const sonicSynth = new SonicSynthEngine();
