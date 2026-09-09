import React, { useEffect, useState } from 'react';
import { Copy, Check, Download, Volume2, VolumeX, Bookmark, Sparkles, Music, Activity, Disc, Zap, Flame, Radio } from 'lucide-react';
import { LyricSet, LyricSection } from '../types';

interface LyricOutputProps {
  setA: LyricSet | null;
  setB: LyricSet | null;
  isAiGenerated: boolean;
  isGenerating: boolean;
  onSaveToFavorites: () => void;
  isSaved: boolean;
}

export const LyricOutput: React.FC<LyricOutputProps> = ({
  setA,
  setB,
  isAiGenerated,
  isGenerating,
  onSaveToFavorites,
  isSaved
}) => {
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'A' | 'B'>('A');
  const [viewMode, setViewMode] = useState<'prosody' | 'clean'>('prosody');
  useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();},[setA,setB]);

  const handleCopy = (text: string, isSetA: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isSetA) {
      setCopiedA(true);
      setTimeout(() => setCopiedA(false), 2000);
    } else {
      setCopiedB(true);
      setTimeout(() => setCopiedB(false), 2000);
    }
  };

  const handleDownload = (set: LyricSet, label: string) => {
    if (!set) return;
    const blob = new Blob([`${set.title}\n\n${set.content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${set.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${label}.txt`;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const speakLyrics = (text: string, isSetA: boolean) => {
    if ('speechSynthesis' in window) {
      if (isSetA && isPlayingA) {
        window.speechSynthesis.cancel();
        setIsPlayingA(false);
        return;
      }
      if (!isSetA && isPlayingB) {
        window.speechSynthesis.cancel();
        setIsPlayingB(false);
        return;
      }

      window.speechSynthesis.cancel();
      // Remove section headers like [INTRO] for smoother reading
      const cleanText = text.replace(/\[.*?\]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const localVoice=window.speechSynthesis.getVoices().find(voice=>voice.localService);
      if(!localVoice){window.alert('A local device voice is not available. Read-aloud stays disabled to avoid sending your lyrics to a remote voice service.');return;}
      utterance.voice=localVoice;
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      utterance.onend = () => {
        setIsPlayingA(false);
        setIsPlayingB(false);
      };

      if (isSetA) setIsPlayingA(true);
      else setIsPlayingB(true);

      window.speechSynthesis.speak(utterance);
    }
  };

  const renderSectionView = (sections?: LyricSection[], rawContent?: string, isA = true) => {
    if (!sections || sections.length === 0 || viewMode === 'clean') {
      return (
        <div className="font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto custom-scrollbar p-3 bg-zinc-950/80 rounded-xl border border-zinc-900 shadow-inner">
          {rawContent}
        </div>
      );
    }

    return (
      <div className="space-y-4 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
        {sections.map((sec, idx) => {
          const accentColor = isA ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-purple-400 border-purple-500/30 bg-purple-500/10';
          return (
            <div key={idx} className="bg-zinc-950/85 border border-zinc-800/90 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${accentColor}`}>
                    [{sec.section_name}]
                  </span>
                  {sec.rhyme_scheme && (
                    <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {sec.rhyme_scheme}
                    </span>
                  )}
                </div>
                {sec.energy_level && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>Energy: {sec.energy_level}/10</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                {sec.lines.map((line, lIdx) => (
                  <div key={lIdx} className="flex items-baseline justify-between gap-2 hover:bg-zinc-900/50 p-1 rounded transition">
                    <span className="font-mono text-xs text-zinc-200 leading-snug">
                      {line.text}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {line.rhyme_markers && (
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
                          {line.rhyme_markers}
                        </span>
                      )}
                      <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        {line.syllables} syl
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isGenerating) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
          <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
        </div>
        <div>
          <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
            Synthesizing 2 Elite Lyric Blueprints...
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Engineered by Lyric Pro Ghostwriter with strict syllable metrics & dual cadence takes.
          </p>
        </div>
      </div>
    );
  }

  if (!setA || !setB) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 sm:p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
          <Music className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-300">No Lyrics Generated Yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Select your Genre, Vibe, and Structure on the left, then click <span className="text-amber-400 font-semibold">"Generate 2 Lyric Sets"</span> to craft dual options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* RESULT BAR HEADER */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Dual Studio Output Ready (Set A & Set B)
              {isAiGenerated && (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                  AI LYRIC STUDIO
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Two completely distinct lyric variations with vocal delivery and hook motifs.
            </div>
          </div>
        </div>

        <button className="px-4 py-2 bg-amber-400 text-black rounded-xl font-bold text-xs" onClick={() => handleDownload({...setA, title:'Both lyric sets',content:`SET A — ${setA.title}\n\n${setA.content}\n\nSET B — ${setB.title}\n\n${setB.content}`}, 'both_sets')}>Download both songs (.txt)</button>
        {/* CONTROLS: PROSODY TOGGLE & SAVE */}
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('prosody')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                viewMode === 'prosody' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Prosody Mode</span>
            </button>
            <button
              onClick={() => setViewMode('clean')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                viewMode === 'clean' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Clean Text</span>
            </button>
          </div>

          <button
            onClick={onSaveToFavorites}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isSaved
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-zinc-950' : ''}`} />
            <span>{isSaved ? 'Saved temporarily' : 'Save for up to 24h'}</span>
          </button>
        </div>
      </div>

      {/* MOBILE TAB TOGGLE */}
      <div className="flex sm:hidden border border-zinc-800 rounded-xl bg-zinc-900 p-1">
        <button
          onClick={() => setActiveTabMobile('A')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTabMobile === 'A' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
          }`}
        >
          Set A (Primary Master)
        </button>
        <button
          onClick={() => setActiveTabMobile('B')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTabMobile === 'B' ? 'bg-purple-500 text-white' : 'text-zinc-400'
          }`}
        >
          Set B (Alternate Flow)
        </button>
      </div>

      {/* DUAL LYRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        {/* SET A CARD */}
        <div className={`bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative border-l-4 border-l-amber-400 card-3d-depth card-3d-hover ${
          activeTabMobile === 'A' ? 'block' : 'hidden sm:flex'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black bg-amber-400 text-zinc-950 px-2.5 py-0.5 rounded font-mono shadow-sm">
                  SET A
                </span>
                <span className="text-xs text-zinc-300 font-mono font-bold truncate max-w-[150px]">
                  {setA.title}
                </span>
              </div>

              {/* SET A TOOL ACTIONS */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => speakLyrics(setA.content, true)}
                  title="Listen to Spoken Cadence"
                  className={`p-2 rounded-lg transition ${
                    isPlayingA ? 'bg-amber-400 text-zinc-950 animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {isPlayingA ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDownload(setA, 'set_A')}
                  title="Download .txt"
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopy(setA.content, true)}
                  title="Copy Lyrics"
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1 text-xs"
                >
                  {copiedA ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* STUDIO METRICS HEADER */}
            {setA.song_metadata && (
              <div className="mb-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Disc className="w-3.5 h-3.5" />
                    {setA.song_metadata.genre_style}
                  </span>
                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    BPM: {setA.song_metadata.target_bpm}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 italic">
                  🎙️ {setA.song_metadata.vocal_delivery_notes}
                </p>
              </div>
            )}

            {/* HOOK EARWORM BREAKDOWN */}
            {setA.hook_breakdown && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Hook Motif & Earworm
                </div>
                <div className="text-xs font-semibold text-white">
                  "{setA.hook_breakdown.core_earworm}"
                </div>
                <div className="text-[10px] text-zinc-400">
                  {setA.hook_breakdown.rhythmic_motif}
                </div>
              </div>
            )}

            {/* LYRICS CONTENT (METRICAL OR CLEAN) */}
            {renderSectionView(setA.lyrics, setA.content, true)}
          </div>
        </div>

        {/* SET B CARD */}
        <div className={`bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative border-l-4 border-l-purple-500 card-3d-depth card-3d-hover ${
          activeTabMobile === 'B' ? 'block' : 'hidden sm:flex'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black bg-purple-500 text-white px-2.5 py-0.5 rounded font-mono shadow-sm">
                  SET B
                </span>
                <span className="text-xs text-zinc-300 font-mono font-bold truncate max-w-[150px]">
                  {setB.title}
                </span>
              </div>

              {/* SET B TOOL ACTIONS */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => speakLyrics(setB.content, false)}
                  title="Listen to Spoken Cadence"
                  className={`p-2 rounded-lg transition ${
                    isPlayingB ? 'bg-purple-500 text-white animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {isPlayingB ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDownload(setB, 'set_B')}
                  title="Download .txt"
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopy(setB.content, false)}
                  title="Copy Lyrics"
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1 text-xs"
                >
                  {copiedB ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* STUDIO METRICS HEADER */}
            {setB.song_metadata && (
              <div className="mb-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <Disc className="w-3.5 h-3.5" />
                    {setB.song_metadata.genre_style}
                  </span>
                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    BPM: {setB.song_metadata.target_bpm}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 italic">
                  🎙️ {setB.song_metadata.vocal_delivery_notes}
                </p>
              </div>
            )}

            {/* HOOK EARWORM BREAKDOWN */}
            {setB.hook_breakdown && (
              <div className="mb-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  Alternate Flow Cadence Motif
                </div>
                <div className="text-xs font-semibold text-white">
                  "{setB.hook_breakdown.core_earworm}"
                </div>
                <div className="text-[10px] text-zinc-400">
                  {setB.hook_breakdown.rhythmic_motif}
                </div>
              </div>
            )}

            {/* LYRICS CONTENT (METRICAL OR CLEAN) */}
            {renderSectionView(setB.lyrics, setB.content, false)}
          </div>
        </div>

      </div>

    </div>
  );
};
