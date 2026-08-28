import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Music,
  Activity,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  FileAudio,
  Radio
} from 'lucide-react';
import {
  autoCorrelate,
  frequencyToPitch,
  DetectedPitch,
  estimateKeyFromChroma,
  analyzeKeyFromAudioBuffer,
  KeyScaleSuggestion
} from '../utils/pitchDetector';

interface KeyPitchFinderProps {
  isAutoSaveOn: boolean;
}

export const KeyPitchFinder: React.FC<KeyPitchFinderProps> = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'upload'>('live');
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<DetectedPitch | null>(null);
  const [pitchHistory, setPitchHistory] = useState<string[]>([]);
  const [liveKeySuggestions, setLiveKeySuggestions] = useState<KeyScaleSuggestion[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // File upload state
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileKeyResults, setFileKeyResults] = useState<KeyScaleSuggestion[]>([]);
  const [chromaBars, setChromaBars] = useState<{ note: string; energy: number }[]>([]);

  // Web Audio references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const chromaAccRef = useRef<number[]>(new Array(12).fill(0));

  const noteNamesList = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Start live microphone tuner
  const startLiveTuner = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);

      const updatePitchLoop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const result = autoCorrelate(buffer, audioCtx.sampleRate);

        if (result && result.clarity > 0.6) {
          const pitch = frequencyToPitch(result.freq);
          if (pitch) {
            setCurrentPitch(pitch);
            // Accumulate chroma for key detection
            const noteIdx = noteNamesList.indexOf(pitch.noteBase);
            if (noteIdx !== -1) {
              chromaAccRef.current[noteIdx] += result.clarity;
              const suggestions = estimateKeyFromChroma(chromaAccRef.current);
              setLiveKeySuggestions(suggestions.slice(0, 3));
            }
            setPitchHistory((prev) => [pitch.noteBase, ...prev.slice(0, 19)]);
          }
        }
        animFrameIdRef.current = requestAnimationFrame(updatePitchLoop);
      };

      updatePitchLoop();
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setMicError(err.message || 'Microphone access denied.');
      setIsListening(false);
    }
  }, []);

  const stopLiveTuner = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopLiveTuner();
    };
  }, [stopLiveTuner]);

  // Handle short audio snippet upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsAnalyzingFile(true);
    setFileKeyResults([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const tempAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await tempAudioCtx.decodeAudioData(arrayBuffer);

      const { topKeys, chromaDistribution } = await analyzeKeyFromAudioBuffer(audioBuffer);
      setFileKeyResults(topKeys);
      setChromaBars(chromaDistribution);
      tempAudioCtx.close();
    } catch (err) {
      console.error('File analysis error:', err);
      alert('Could not decode audio file. Please try a standard WAV, MP3, or M4A file.');
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const handleResetHistory = () => {
    chromaAccRef.current = new Array(12).fill(0);
    setPitchHistory([]);
    setLiveKeySuggestions([]);
    setCurrentPitch(null);
  };

  const handleCopyKey = (keyName: string) => {
    navigator.clipboard.writeText(keyName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between bg-[#111] border border-white/5 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-xl border border-white/5 text-xs font-mono">
          <button
            id="pitch-tab-live"
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider ${activeTab === 'live'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-white/40 hover:text-white'
              }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>real-time mic tuner</span>
          </button>
          <button
            id="pitch-tab-upload"
            onClick={() => {
              stopLiveTuner();
              setActiveTab('upload');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider ${activeTab === 'upload'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-white/40 hover:text-white'
              }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>snippet key analyzer</span>
          </button>
        </div>

        <span className="text-xs font-mono text-white/40 hidden sm:inline">
          web audio api fundamental detection
        </span>
      </div>

      {micError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-2.5 rounded-xl font-mono flex items-center justify-between">
          <span>{micError}</span>
          <button onClick={() => setMicError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {activeTab === 'live' ? (
        /* LIVE MIC TUNER VIEW */
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs font-mono text-white/40">
            <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>live pitch & tuning gauge</span>
            </div>
            {isListening && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>monitoring mic</span>
              </span>
            )}
          </div>

          {/* Note & Pitch Big Display */}
          <div className="py-4 space-y-3">
            {currentPitch ? (
              <div className="space-y-1">
                <div className="inline-flex items-baseline justify-center gap-2">
                  <span className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-white">
                    {currentPitch.noteBase}
                  </span>
                  <span className="text-3xl sm:text-4xl font-mono text-emerald-400 font-bold">
                    {currentPitch.octave}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs font-mono text-white/40">
                  <span>{currentPitch.frequency} Hz</span>
                  <span>•</span>
                  <span className={Math.abs(currentPitch.cents) <= 5 ? 'text-emerald-400 font-bold' : currentPitch.cents > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                    {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents} cents
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-white/40 font-mono text-sm space-y-2">
                <p className="text-lg text-white">
                  {isListening ? 'sing, hum, or play an instrument note...' : 'click start tuner below to begin'}
                </p>
                <p className="text-xs text-white/40">detects fundamental frequency, cents deviation, and musical key</p>
              </div>
            )}
          </div>

          {/* Cents Tuning Gauge (-50 to +50) */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>-50 flat</span>
              <span className="text-emerald-400 font-bold">0 in-tune</span>
              <span>+50 sharp</span>
            </div>

            {/* Gauge meter bar */}
            <div className="h-3 bg-[#050505] border border-white/10 rounded-full relative overflow-hidden">
              {/* Center in-tune target notch */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-emerald-400 -translate-x-1/2 z-10" />

              {/* Indicator pointer */}
              {currentPitch && (
                <div
                  className="absolute top-0 bottom-0 w-3 rounded-full bg-emerald-400 -translate-x-1/2 transition-all duration-75 shadow-lg shadow-emerald-400/50"
                  style={{
                    left: `${Math.max(5, Math.min(95, ((currentPitch.cents + 50) / 100) * 100))}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              id="pitch-toggle-mic-btn"
              onClick={isListening ? stopLiveTuner : startLiveTuner}
              className={`px-6 py-3.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all uppercase tracking-wider ${isListening
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening ? 'stop tuner' : 'start live mic tuner'}</span>
            </button>

            {pitchHistory.length > 0 && (
              <button
                onClick={handleResetHistory}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 cursor-pointer"
                title="Reset history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Live Key Scale Suggestions based on detected notes */}
          {liveKeySuggestions.length > 0 && (
            <div className="pt-4 border-t border-white/5 text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-white/40">
                <span className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>estimated musical key & scale (from live notes)</span>
                </span>
                <span className="text-[11px] text-white/40">top likelihood</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {liveKeySuggestions.map((k, i) => (
                  <div
                    key={i}
                    onClick={() => handleCopyKey(k.name)}
                    className="p-3.5 bg-[#050505] hover:bg-white/5 border border-white/5 rounded-xl space-y-1 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-mono text-white group-hover:text-emerald-400">
                        {k.name}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {k.confidence}% match
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-white/40 truncate">
                      Relative: {k.relativeKey}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {k.notesInScale.map((n, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 text-white/50">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* AUDIO FILE SNIPPET ANALYZER VIEW */
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs font-mono text-white/40">
            <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
              <FileAudio className="w-4 h-4 text-emerald-400" />
              <span>upload audio snippet to analyze key</span>
            </div>
            <span className="text-white/40">wav, mp3, m4a, flac</span>
          </div>

          {/* Upload Drop Area */}
          <label className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 bg-[#050505] hover:bg-white/5 p-8 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-emerald-400" />
            <div className="text-center font-mono text-xs">
              <span className="text-white font-bold block mb-1">
                {uploadedFileName ? uploadedFileName : 'choose or drag audio file snippet'}
              </span>
              <span className="text-white/40">processes 100% locally in browser</span>
            </div>
            <input
              id="upload-audio-key-file-input"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {isAnalyzingFile && (
            <div className="text-center py-6 text-xs font-mono text-white/40 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>running pitch chromagram and key correlation...</span>
            </div>
          )}

          {/* File Key Results */}
          {fileKeyResults.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-white/60">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">top detected key signatures</span>
                <span className="text-white/40">click to copy</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fileKeyResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopyKey(item.name)}
                    className="p-4 bg-[#050505] border border-white/5 hover:border-emerald-500/40 rounded-xl space-y-2 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-white group-hover:text-emerald-400">
                        {item.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {item.confidence}%
                      </span>
                    </div>

                    <p className="text-xs font-sans text-white/40">
                      Relative: <strong className="text-white/80">{item.relativeKey}</strong>
                    </p>

                    <div>
                      <span className="text-[10px] font-mono text-white/40 block mb-1">Scale Notes:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.notesInScale.map((n, i) => (
                          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/70 border border-white/5">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chroma Energy Visualizer */}
              {chromaBars.length > 0 && (
                <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-2">
                  <span className="text-[11px] font-mono text-white/40 block">
                    chroma harmonic energy distribution:
                  </span>
                  <div className="grid grid-cols-12 gap-1 h-16 items-end pt-2">
                    {chromaBars.map((b, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className="w-full bg-emerald-400/80 rounded-t transition-all"
                          style={{ height: `${Math.max(8, b.energy)}%` }}
                          title={`${b.note}: ${b.energy}%`}
                        />
                        <span className="text-[10px] font-mono text-white/40">{b.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
