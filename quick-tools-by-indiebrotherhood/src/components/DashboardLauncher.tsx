import React, { useState, useEffect } from 'react';
import { ActiveTool } from '../types';
import {
  FileText,
  Activity,
  Mic2,
  BookOpen,
  Music,
  Users,
  Volume2,
  Share2,
  ArrowUpRight,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  Sliders,
  Radio,
  Percent,
  Play
} from 'lucide-react';

interface DashboardLauncherProps {
  onSelectTool: (tool: ActiveTool) => void;
}

export const DashboardLauncher: React.FC<DashboardLauncherProps> = ({ onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Writing' | 'Audio & Tuning' | 'Production & Business'>('All');

  // Quick interactive states on dashboard bento tiles
  const [quickBpm, setQuickBpm] = useState(124.0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isBpmPulsing, setIsBpmPulsing] = useState(false);

  const isTileVisible = (category: 'Writing' | 'Audio & Tuning' | 'Production & Business', terms: string[]) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesCategory = selectedCategory === 'All' || selectedCategory === category;
    return matchesCategory && (!query || terms.some((term) => term.includes(query)));
  };

  const handleQuickTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = performance.now();
    setIsBpmPulsing(true);
    setTimeout(() => setIsBpmPulsing(false), 150);

    const recent = [...tapTimes.filter((t) => now - t < 3000), now];
    setTapTimes(recent);

    if (recent.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        diffs.push(recent[i] - recent[i - 1]);
      }
      const avgMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (avgMs > 0) {
        const bpmVal = Math.round((60000 / avgMs) * 10) / 10;
        setQuickBpm(Math.min(300, Math.max(30, bpmVal)));
      }
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Controls & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="dashboard-search-tools-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio tools, keywords, features..."
            className="w-full bg-[#111] border border-white/5 rounded-xl pl-10 pr-8 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-mono cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['All', 'Writing', 'Audio & Tuning', 'Production & Business'] as const).map((cat) => (
            <button
              key={cat}
              id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/5 hover:border-white/10'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* BENTO TILE 1: Lyric Scratchpad (Large hero card: col-span-12 md:col-span-7 lg:col-span-8) */}
        {isTileVisible('Writing', ['lyrics', 'scratchpad', 'writing', 'syllable', 'dictation']) && (
          <div
            id="launcher-card-lyrics"
            onClick={() => onSelectTool('lyrics')}
            className="col-span-12 md:col-span-7 lg:col-span-8 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-emerald-500/40 p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">lyric scratchpad</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] rounded border border-emerald-500/20 font-bold uppercase tracking-wide">
                    GUIDED MODE
                  </span>
                  <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">
                    [1]
                  </span>
                </div>
              </div>

              {/* Blank Scratchpad Visual Preview */}
              <div className="space-y-2.5 font-mono text-sm leading-relaxed text-white/40 pt-1">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/30 text-xs italic">Line 1: Enter lyrics or record voice...</span>
                  <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded font-mono">0 syl</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/20 text-xs italic">Line 2: Rhyme schemes and syllables tag automatically</span>
                  <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded font-mono">0 syl</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/20 text-xs italic">Line 3: Real-time phonetic assistant & dictation</span>
                  <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded font-mono">0 syl</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-emerald-400/70 font-mono text-xs flex items-center gap-1.5">
                    <span>Ready for input</span>
                    <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse" />
                  </p>
                  <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded italic">scratchpad empty</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
              <span className="text-white/40 group-hover:text-white/70 transition-colors">free write • syllable tags • speech dictation</span>
              <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                open scratchpad <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* BENTO TILE 2: BPM Counter / Tap Tempo (col-span-12 md:col-span-5 lg:col-span-4) */}
        {isTileVisible('Audio & Tuning', ['bpm', 'tap', 'tempo', 'audio']) && (
          <div
            id="launcher-card-bpm"
            onClick={() => onSelectTool('bpm')}
            className="col-span-12 md:col-span-5 lg:col-span-4 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-emerald-500/40 p-6 flex flex-col justify-between group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">bpm tap</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isBpmPulsing ? 'bg-emerald-400 scale-125' : 'bg-emerald-500'} transition-all`} />
                <span className="px-1.5 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">[2]</span>
              </div>
            </div>

            <div className="text-center py-4">
              <span className="text-5xl font-light tracking-tighter text-white font-mono">
                {tapTimes.length >= 2 ? quickBpm.toFixed(1) : '--.-'}
              </span>
              <span className="block text-[10px] text-white/30 uppercase tracking-widest mt-1 font-mono">
                {tapTimes.length >= 2 ? 'avg bpm calculated' : 'tap tempo to calculate bpm'}
              </span>
            </div>

            <button
              onClick={handleQuickTap}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white active:scale-95 transition-all cursor-pointer"
            >
              TAP TEMPO
            </button>
          </div>
        )}

        {/* BENTO TILE 3: Key Pitch Finder (col-span-12 md:col-span-6 lg:col-span-4) */}
        {isTileVisible('Audio & Tuning', ['key', 'pitch', 'tuning', 'microphone']) && (
          <div
            id="launcher-card-pitch"
            onClick={() => onSelectTool('pitch')}
            className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-amber-500/40 p-6 flex flex-col justify-between group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Mic2 className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">key finder</h2>
              </div>
              <span className="px-1.5 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">[3]</span>
            </div>

            <div className="flex items-end gap-2 py-4">
              <span className="text-5xl font-light text-white/30 italic font-mono">--</span>
              <span className="text-xl text-white/20 pb-1 font-sans">idle</span>
              <span className="text-[10px] text-white/30 font-mono pb-2 ml-auto">mic inactive</span>
            </div>

            <div className="flex gap-1.5 h-7 items-end">
              <div className="w-full bg-white/5 h-[15%] rounded-t-sm"></div>
              <div className="w-full bg-white/5 h-[15%] rounded-t-sm"></div>
              <div className="w-full bg-white/5 h-[15%] rounded-t-sm"></div>
              <div className="w-full bg-white/5 h-[15%] rounded-t-sm"></div>
              <div className="w-full bg-white/5 h-[15%] rounded-t-sm"></div>
            </div>
          </div>
        )}

        {/* BENTO TILE 4: Split Sheet Calculator (col-span-12 md:col-span-6 lg:col-span-4) */}
        {isTileVisible('Production & Business', ['split', 'sheet', 'collaborator', 'publishing']) && (
          <div
            id="launcher-card-splits"
            onClick={() => onSelectTool('splits')}
            className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-indigo-500/40 p-6 flex flex-col justify-between group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">split sheet</h2>
                </div>
                <span className="px-1.5 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">[6]</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-[11px] border-b border-white/5 pb-1 text-white/30">
                  <span>Collaborator 1</span>
                  <span>0%</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-white/5 pb-1 text-white/30">
                  <span>Collaborator 2</span>
                  <span>0%</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-white/5 pb-1 text-white/20">
                  <span>+ Add collaborators...</span>
                  <span>0%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 flex justify-between items-center border-t border-white/5 font-mono">
              <span className="text-[10px] text-white/30 uppercase">TOTAL SPLIT</span>
              <span className="text-[10px] font-bold text-white/40 px-2 py-0.5 bg-white/5 rounded border border-white/10">
                0% / 100%
              </span>
            </div>
          </div>
        )}

        {/* BENTO TILE 5: Peak Checker / LUFS (col-span-12 md:col-span-6 lg:col-span-4) */}
        {isTileVisible('Production & Business', ['peak', 'lufs', 'gain', 'streaming', 'audio']) && (
          <div
            id="launcher-card-gain"
            onClick={() => onSelectTool('gain')}
            className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-rose-500/40 p-6 flex flex-col justify-between group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">peak checker</h2>
              </div>
              <span className="px-1.5 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">[5]</span>
            </div>

            <div className="space-y-3 py-1 font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>SAMPLE PEAK</span>
                  <span className="text-white/30 font-bold">-- dBFS</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/10 w-0" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>STREAMING LUFS</span>
                  <span className="text-white/30 font-bold">-- LUFS</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/10 w-0" />
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] font-mono text-white/40 flex justify-between items-center">
              <span>ESTIMATED LOUDNESS</span>
              <span className="text-rose-400 group-hover:underline">analyze file →</span>
            </div>
          </div>
        )}

        {/* BENTO TILE 6: Track Metadata & Registration (col-span-12 md:col-span-6 lg:col-span-6) */}
        {isTileVisible('Production & Business', ['metadata', 'isrc', 'genre', 'registration']) && (
          <div
            id="launcher-card-metadata"
            onClick={() => onSelectTool('metadata')}
            className="col-span-12 md:col-span-6 lg:col-span-6 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-teal-500/40 p-6 flex flex-col justify-between group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">track metadata</h2>
                </div>
                <span className="px-1.5 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">[7]</span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase block">Song Title</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/30 truncate italic">
                    Not set
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase block">Artist</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/30 truncate italic">
                    Not set
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase block">ISRC Code</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white/30 truncate italic">
                    Not set
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase block">Genre</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/30 truncate italic">
                    Not set
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
              <span>ID3 tags & PRO sheet export</span>
              <span className="text-teal-400 group-hover:underline">edit metadata →</span>
            </div>
          </div>
        )}

        {/* BENTO TILE 7: Smart Link & EPK Generator (col-span-12 md:col-span-6 lg:col-span-6) */}
        {isTileVisible('Production & Business', ['smart', 'link', 'epk', 'release', 'artwork']) && (
          <div
            id="launcher-card-smartlink"
            onClick={() => onSelectTool('smartlink')}
            className="col-span-12 md:col-span-6 lg:col-span-6 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-fuchsia-500/40 p-6 flex flex-col justify-between group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                    <Share2 className="w-3.5 h-3.5 text-fuchsia-400" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">smart link & epk</h2>
                </div>
                <span className="px-1.5 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">[8]</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-white/20">
                  <Share2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-xs font-bold text-white/40 block truncate font-mono italic">No release configured</span>
                  <span className="text-[11px] text-white/30 block truncate">Custom links, artwork & bio</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-white/40">Spotify</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-white/40">Apple</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-white/40">+ more</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
              <span>mobile landing page generator</span>
              <span className="text-fuchsia-400 group-hover:underline">preview & export →</span>
            </div>
          </div>
        )}

        {/* BENTO TILE 8: Rhyme & Near-Rhyme Standalone (col-span-12) */}
        {isTileVisible('Writing', ['rhyme', 'phonetic', 'near-rhyme', 'definitions']) && (
          <div
            id="launcher-card-rhymes"
            onClick={() => onSelectTool('rhymes')}
            className="col-span-12 bg-[#111] hover:bg-[#141414] rounded-2xl border border-white/5 hover:border-violet-500/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer transition-all duration-200 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight">rhyme & phonetic engine</h3>
                  <span className="px-1.5 py-0.5 bg-white/5 text-white/40 text-[10px] rounded font-mono">[4]</span>
                </div>
                <p className="text-xs text-white/40 font-sans mt-0.5">
                  instant multi-syllable exact rhymes, slant rhymes, phonetic assonance, and dictionary definitions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <div className="flex items-center gap-1.5 text-xs font-mono text-white/40 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>syllable filtering • dictionary lookup</span>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider group-hover:bg-gray-200 transition-colors">
                open tool
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

