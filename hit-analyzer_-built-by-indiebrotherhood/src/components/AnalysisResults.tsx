import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  Wrench,
  Activity,
  Mic,
  Music2,
  Radio,
  Share2,
  Download,
  Info,
  ChevronRight,
  Flame,
  Volume2,
  FileText
} from 'lucide-react';

interface AnalysisResultsProps {
  result: AnalysisResult;
  songTitle: string;
  artistName: string;
  onReset: () => void;
  onOpenHelp: (tab?: 'logic' | 'tos' | 'guide') => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  songTitle,
  artistName,
  onReset,
  onOpenHelp,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audio' | 'lyrics' | 'logic'>('overview');
  const [copied, setCopied] = useState(false);

  const {
    hitPotentialScore,
    tierBadge,
    audioAnalysis,
    lyricAnalysis,
    whatsWorking,
    areasToTweak,
    logicExplanation,
  } = result;

  // Score badge color calculation
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: 'from-emerald-400 to-teal-500' };
    if (score >= 80) return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', ring: 'from-indigo-400 to-purple-500' };
    if (score >= 70) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: 'from-amber-400 to-orange-500' };
    return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', ring: 'from-purple-400 to-pink-500' };
  };

  const scoreTheme = getScoreColor(hitPotentialScore);

  const handleShare = () => {
    const text = `🎵 Hit Analyzer Report for "${songTitle}" by ${artistName || "Indie Artist"}\nHit Potential Score: ${hitPotentialScore}/100 [${tierBadge}]\nAnalyzed by indiebrotherhood 2026 Engine`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* TOP SUMMARY HERO CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${scoreTheme.ring}`} />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Song Info & Score Meter */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            
            {/* Hit Potential Score Circle */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-slate-950 border-4 border-slate-800 flex flex-col items-center justify-center shadow-inner relative group">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${scoreTheme.ring} opacity-20 blur-md group-hover:opacity-40 transition-opacity`} />
                <span className="text-4xl font-black text-white tracking-tight font-sans">
                  {hitPotentialScore}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  / 100 Score
                </span>
              </div>
            </div>

            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border} flex items-center gap-1.5`}>
                  <Flame className="w-3.5 h-3.5" /> {tierBadge}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {audioAnalysis.genre || "Indie Original"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {songTitle || "Untitled Track"}
              </h2>

              <p className="text-sm font-medium text-slate-400">
                by <span className="text-slate-200 font-bold">{artistName || "Indie Artist"}</span> • Evaluated via 2026 Platform Logic
              </p>
            </div>

          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-indigo-400" />
              {copied ? "Copied Report!" : "Share Report"}
            </button>

            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              Analyze Another Song
            </button>
          </div>

        </div>

      </div>

      {/* ANALYSIS NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-2xl gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Hit Potential Breakdown
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'audio'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          Audio & Vocal Diagnostics
        </button>

        {lyricAnalysis && (
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'lyrics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            Lyrical Precision
          </button>
        )}

        <button
          onClick={() => setActiveTab('logic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'logic'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          How Logic Works
        </button>
      </div>

      {/* TAB 1: OVERVIEW (STRENGTHS & TWEAKS) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* WHAT'S WORKING (STRENGTHS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">What's Working</h3>
                <p className="text-xs text-emerald-400 font-medium">Core hit assets & commercial strengths</p>
              </div>
            </div>

            <ul className="space-y-3">
              {whatsWorking.map((strength, index) => (
                <li key={index} className="flex items-start gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AREAS FOR TWEAK & IMPROVEMENT */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">What Can Be Tweaked</h3>
                <p className="text-xs text-amber-400 font-medium">Actionable production & arrangement optimizations</p>
              </div>
            </div>

            <ul className="space-y-3">
              {areasToTweak.map((tweak, index) => (
                <li key={index} className="flex items-start gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{tweak}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

      {/* TAB 2: AUDIO & VOCAL DIAGNOSTICS */}
      {activeTab === 'audio' && (
        <div className="space-y-6">
          
          {/* Key Metric Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><Mic className="w-4 h-4 text-indigo-400" /> Vocal Quality</span>
                <span className="font-bold text-indigo-400">{audioAnalysis.vocalQualityScore}/100</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${audioAnalysis.vocalQualityScore}%` }} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><Music2 className="w-4 h-4 text-emerald-400" /> Tune & Melody</span>
                <span className="font-bold text-emerald-400">{audioAnalysis.tuneMelodyScore}/100</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${audioAnalysis.tuneMelodyScore}%` }} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-purple-400" /> Estimated Tempo</span>
                <span className="font-bold text-purple-400">{audioAnalysis.tempoBpm} BPM</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">Pacing optimized for streaming retention</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><Volume2 className="w-4 h-4 text-amber-400" /> Vibe Profile</span>
                <span className="font-bold text-amber-400">{audioAnalysis.genre}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{audioAnalysis.vibe}</div>
            </div>
          </div>

          {/* Detailed Audio Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-400" /> Vocal & Tone Diagnosis
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {audioAnalysis.vocalQualityReview}
              </p>

              <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-2">
                <Music2 className="w-4 h-4 text-emerald-400" /> Tune & Melodic Hook Strength
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {audioAnalysis.tuneMelodyReview}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" /> Arrangement & Structure Breakdown
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
                {audioAnalysis.structure}
              </p>

              <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-2">
                <Volume2 className="w-4 h-4 text-purple-400" /> Mix Balance & Dynamic Range
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {audioAnalysis.mixDynamic}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: LYRICS ANALYSIS */}
      {activeTab === 'lyrics' && lyricAnalysis && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white">Lyrical Precision & Phonetic Flow</h3>
              <p className="text-xs text-purple-300">Detailed breakdown of wordplay, rhyme structure & hook memorability</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Rhyme Scheme Score</span>
              <div className="text-2xl font-black text-purple-400">{lyricAnalysis.rhymeSchemeScore}/100</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-400">Hook Earworm Density</span>
              <p className="text-xs text-slate-200 font-medium">{lyricAnalysis.hookMemorability}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Narrative Impact</span>
              <p className="text-xs text-slate-300 leading-relaxed">{lyricAnalysis.narrativeImpact}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Phonetic Bounce over Downbeats</span>
              <p className="text-xs text-slate-300 leading-relaxed">{lyricAnalysis.phoneticFlow}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HOW THE LOGIC WORKS */}
      {activeTab === 'logic' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Algorithmic Scoring Rationale</h3>
            </div>
            <button
              onClick={() => onOpenHelp('logic')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" /> Full Logic Manual
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            {logicExplanation}
          </p>

          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 space-y-1">
            <strong className="text-white block">Note from indiebrotherhood:</strong>
            Hit potential is a combination of engineering precision and artistic emotion. Use these actionable tweaks to optimize your master mix before releasing to Spotify, Apple Music, or short-form platforms.
          </div>
        </div>
      )}

    </div>
  );
};
