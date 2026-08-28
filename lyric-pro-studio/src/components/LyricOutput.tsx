import React, { useState } from 'react';
import { Copy, Check, Download, Volume2, VolumeX, Bookmark, Sparkles, Music, FileText } from 'lucide-react';
import { LyricSet } from '../types';

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
    a.click();
    URL.revokeObjectURL(url);
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
            Synthesizing 2 Elite Lyric Sets...
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Engineered with genre-tailored rhyming schemes and dual cadence variations.
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
            Select your Genre, Vibe, and Mode on the left, then click <span className="text-amber-400 font-semibold">"Generate 2 Lyric Sets"</span> to craft dual options.
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
              Dual Output Ready (Set A & Set B)
              {isAiGenerated && (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                  GEMINI AI POWERED
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Two completely distinct lyric variations generated simultaneously.
            </div>
          </div>
        </div>

        {/* SAVE TO FAVORITES */}
        <button
          onClick={onSaveToFavorites}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            isSaved
              ? 'bg-amber-400 text-zinc-950 font-bold'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-zinc-950' : ''}`} />
          <span>{isSaved ? 'Saved to Vault' : 'Save Both Sets'}</span>
        </button>
      </div>

      {/* MOBILE TAB TOGGLE */}
      <div className="flex sm:hidden border border-zinc-800 rounded-xl bg-zinc-900 p-1">
        <button
          onClick={() => setActiveTabMobile('A')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTabMobile === 'A' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
          }`}
        >
          Set A (Option 1)
        </button>
        <button
          onClick={() => setActiveTabMobile('B')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTabMobile === 'B' ? 'bg-purple-500 text-white' : 'text-zinc-400'
          }`}
        >
          Set B (Option 2)
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

            {setA.summaryNote && (
              <p className="text-[11px] text-amber-300/90 italic mb-3 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                "{setA.summaryNote}"
              </p>
            )}

            {/* LYRICS TEXT CONTENT */}
            <div className="font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto custom-scrollbar p-3 bg-zinc-950/80 rounded-xl border border-zinc-900 shadow-inner">
              {setA.content}
            </div>
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

            {setB.summaryNote && (
              <p className="text-[11px] text-purple-300/90 italic mb-3 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                "{setB.summaryNote}"
              </p>
            )}

            {/* LYRICS TEXT CONTENT */}
            <div className="font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto custom-scrollbar p-3 bg-zinc-950/80 rounded-xl border border-zinc-900 shadow-inner">
              {setB.content}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
