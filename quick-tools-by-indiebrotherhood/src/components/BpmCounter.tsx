import { usePrivateStorage } from '../../../shared/PrivateWorkspaceGate';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Zap, 
  Sliders, 
  Sparkles,
  Download
} from 'lucide-react';

interface BpmCounterProps {
  isAutoSaveOn: boolean;
  lastSaved: Date | null;
}

const TEMPO_MARKINGS = [
  { name: 'Grave', min: 20, max: 45, desc: 'Very slow, solemn' },
  { name: 'Largo', min: 45, max: 60, desc: 'Broad, slow, stately' },
  { name: 'Adagio', min: 60, max: 76, desc: 'Slow, leisurely' },
  { name: 'Andante', min: 76, max: 108, desc: 'Walking pace' },
  { name: 'Moderato', min: 108, max: 120, desc: 'Moderate tempo' },
  { name: 'Allegro', min: 120, max: 156, desc: 'Fast, lively, bright' },
  { name: 'Vivace', min: 156, max: 176, desc: 'Very fast and lively' },
  { name: 'Presto', min: 176, max: 220, desc: 'Extremely quick' },
  { name: 'Prestissimo', min: 220, max: 300, desc: 'Maximum speed' },
];

const GENRE_SUGGESTIONS = [
  { genre: 'Lo-Fi / Chill', range: '70 - 85' },
  { genre: 'Boom Bap / Hip-Hop', range: '85 - 95' },
  { genre: 'R&B / Soul', range: '90 - 110' },
  { genre: 'Pop / Indie Rock', range: '115 - 128' },
  { genre: 'House / Dance', range: '120 - 128' },
  { genre: 'Trap / Drill', range: '130 - 150' },
  { genre: 'Techno / Trance', range: '128 - 145' },
  { genre: 'Drum & Bass', range: '170 - 175' },
];

export const BpmCounter: React.FC<BpmCounterProps> = () => {
  const localStorage = usePrivateStorage();
  const [bpm, setBpm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('indie_last_bpm');
      return saved ? Number(saved) : 120;
    } catch {
      return 120;
    }
  });

  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapCount, setTapCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Metronome states
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '3/4' | '6/8'>('4/4');
  const [currentBeat, setCurrentBeat] = useState(1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<number | null>(null);

  // Handle Tap calculation
  const handleTap = useCallback(() => {
    const now = performance.now();
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 120);

    setTapTimes((prev) => {
      // If last tap was more than 3 seconds ago, start fresh
      const filtered = prev.length > 0 && now - prev[prev.length - 1] > 3000 ? [] : prev;
      const updated = [...filtered, now].slice(-16); // keep last 16 taps

      if (updated.length >= 2) {
        // Calculate intervals
        const intervals: number[] = [];
        for (let i = 1; i < updated.length; i++) {
          intervals.push(updated[i] - updated[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const computedBpm = Math.round(60000 / avgInterval);

        if (computedBpm >= 30 && computedBpm <= 300) {
          setBpm(computedBpm);
          try {
            localStorage.setItem('indie_last_bpm', String(computedBpm));
          } catch (e) {
            console.error(e);
          }
        }
      }

      return updated;
    });

    setTapCount((c) => c + 1);
  }, []);

  // Spacebar trigger listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  // Metronome audio click engine
  const playClickSound = useCallback((isAccent: boolean) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1200 : 800, ctx.currentTime);
      gain.gain.setValueAtTime(volume * (isAccent ? 0.9 : 0.5), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }, [isMuted, volume]);

  // Metronome scheduler loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      setCurrentBeat(1);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    const beatsPerBar = timeSignature === '3/4' ? 3 : timeSignature === '6/8' ? 6 : 4;

    let beat = 1;
    playClickSound(true);
    setCurrentBeat(1);

    const id = window.setInterval(() => {
      beat = (beat % beatsPerBar) + 1;
      setCurrentBeat(beat);
      playClickSound(beat === 1);
    }, intervalMs);

    timerIdRef.current = id;
    return () => clearInterval(id);
  }, [isPlaying, bpm, timeSignature, playClickSound]);

  const handleReset = () => {
    setTapTimes([]);
    setTapCount(0);
    setBpm(120);
    setIsPlaying(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${bpm} BPM`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const currentMarking = TEMPO_MARKINGS.find((m) => bpm >= m.min && bpm <= m.max) || TEMPO_MARKINGS[4];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Main Tap Box */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 text-center relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between text-xs font-mono text-white/40 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>tap tempo & metronome</span>
          </div>
          <span className="text-white/40 text-[11px]">shortcut: [spacebar] to tap</span>
        </div>

        {/* Big BPM Display */}
        <div className="space-y-2 py-2">
          <div className="inline-flex items-baseline justify-center gap-3">
            <span 
              id="bpm-value-display"
              className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter text-white transition-transform ${
                isPulsing ? 'scale-105 text-emerald-400' : ''
              }`}
            >
              {bpm}
            </span>
            <span className="text-xl sm:text-2xl font-mono text-white/40 font-bold uppercase">bpm</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              {currentMarking.name} ({currentMarking.desc})
            </span>
          </div>
        </div>

        {/* The Big Interactive Tap Button */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            id="tap-tempo-main-btn"
            onClick={handleTap}
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 flex flex-col items-center justify-center gap-2 transition-all duration-75 cursor-pointer select-none active:scale-95 shadow-2xl ${
              isPulsing
                ? 'bg-emerald-500/20 border-emerald-400 shadow-emerald-500/20 text-white scale-98'
                : 'bg-[#050505] hover:bg-white/5 border-white/10 hover:border-emerald-500/50 text-white'
            }`}
          >
            <Zap className={`w-8 h-8 ${isPulsing ? 'text-emerald-300' : 'text-emerald-400'}`} />
            <span className="text-lg font-mono font-bold uppercase tracking-wider">tap beat</span>
            <span className="text-[11px] font-mono text-white/40">or press spacebar</span>
          </button>

          <span className="text-xs font-mono text-white/40">
            {tapCount > 0 ? `${tapCount} taps registered` : 'tap steadily at least 3-4 times'}
          </span>
        </div>

        {/* BPM Quick Slider & Step Buttons */}
        <div className="max-w-md mx-auto space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/40">
            <span>30 bpm</span>
            <span>slider fine-tune</span>
            <span>300 bpm</span>
          </div>
          <input
            id="bpm-slider-control"
            type="range"
            min="30"
            max="300"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex items-center justify-center gap-2 pt-1 font-mono text-xs">
            <button
              onClick={() => setBpm((b) => Math.max(30, b - 5))}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/70 cursor-pointer"
            >
              -5
            </button>
            <button
              onClick={() => setBpm((b) => Math.max(30, b - 1))}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/70 cursor-pointer"
            >
              -1
            </button>
            <button
              onClick={() => setBpm((b) => Math.min(300, b + 1))}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/70 cursor-pointer"
            >
              +1
            </button>
            <button
              onClick={() => setBpm((b) => Math.min(300, b + 5))}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/70 cursor-pointer"
            >
              +5
            </button>
            <button
              onClick={() => setBpm((b) => Math.round(b / 2))}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/40 cursor-pointer"
              title="Half-time"
            >
              ½x
            </button>
            <button
              onClick={() => setBpm((b) => Math.min(300, b * 2))}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/40 cursor-pointer"
              title="Double-time"
            >
              2x
            </button>
          </div>
        </div>

        {/* Metronome Bar & Controls */}
        <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="metronome-play-toggle-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all uppercase tracking-wider ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'stop metronome' : 'start metronome'}</span>
            </button>

            {/* Time signature picker */}
            <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-white/5 text-xs font-mono">
              {(['4/4', '3/4', '6/8'] as const).map((sig) => (
                <button
                  key={sig}
                  onClick={() => setTimeSignature(sig)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    timeSignature === sig ? 'bg-white/10 text-emerald-400 font-bold' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {sig}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Beat Indicator Dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: timeSignature === '3/4' ? 3 : timeSignature === '6/8' ? 6 : 4 }).map((_, i) => {
              const beatNum = i + 1;
              const isCurrent = isPlaying && currentBeat === beatNum;
              const isAccent = beatNum === 1;

              return (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full transition-all duration-75 flex items-center justify-center text-[10px] font-mono font-bold ${
                    isCurrent
                      ? isAccent
                        ? 'bg-emerald-400 text-black scale-125 shadow-md shadow-emerald-400/50'
                        : 'bg-white text-black scale-110'
                      : 'bg-white/5 text-white/30 border border-white/5'
                  }`}
                >
                  {beatNum}
                </div>
              );
            })}
          </div>

          {/* Volume & Reset / Copy buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 cursor-pointer"
              title={isMuted ? 'Unmute click' : 'Mute click'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="bpm-copy-btn"
              onClick={handleCopy}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'copied!' : 'copy bpm'}</span>
            </button>

            <button
              id="bpm-reset-btn"
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 cursor-pointer"
              title="Reset Taps"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Genre Tempo Guidance Reference */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-white/40 border-b border-white/5 pb-2.5 uppercase tracking-wider font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>genre tempo cheat-sheet (click to apply)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GENRE_SUGGESTIONS.map((g, idx) => (
            <button
              key={idx}
              onClick={() => {
                const target = parseInt(g.range.split('-')[0].trim(), 10);
                setBpm(target);
              }}
              className="p-3 rounded-xl bg-[#050505] hover:bg-white/5 border border-white/5 hover:border-white/10 text-left transition-colors cursor-pointer group"
            >
              <span className="text-[11px] font-mono text-white/40 group-hover:text-emerald-400 block truncate">
                {g.genre}
              </span>
              <span className="text-sm font-mono font-bold text-white block mt-0.5">
                {g.range} BPM
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
