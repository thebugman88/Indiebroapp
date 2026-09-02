import React, { useEffect, useState } from 'react';
import {
  Gavel,
  UploadCloud,
  FileBarChart,
  Disc3,
  Sliders,
  ShieldCheck,
  Zap,
  Clock,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  Crown,
  Ear
} from 'lucide-react';
import { UserJudgeProfile } from '../types';
import { getTimeUntilReset, JUDGE_TIERS } from '../utils/matchmaker';

interface HeaderProps {
  activeTab: 'chamber' | 'submit' | 'dossier' | 'vault' | 'sonic';
  onSelectTab: (tab: 'chamber' | 'submit' | 'dossier' | 'vault' | 'sonic') => void;
  userProfile: UserJudgeProfile;
  onOpenTiers: () => void;
  onOpenTerms: () => void;
  queuedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  userProfile,
  onOpenTiers,
  onOpenTerms,
  queuedCount
}) => {
  const [resetTimer, setResetTimer] = useState(getTimeUntilReset(userProfile.lastCycleTimestamp));

  useEffect(() => {
    const timer = setInterval(() => {
      setResetTimer(getTimeUntilReset(userProfile.lastCycleTimestamp));
    }, 1000);
    return () => clearInterval(timer);
  }, [userProfile.lastCycleTimestamp]);

  const tierData = JUDGE_TIERS[userProfile.judgeTier];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Grand Arbiter':
        return <Crown className="w-4 h-4 text-amber-300" />;
      case 'Master Tastemaker':
        return <Sparkles className="w-4 h-4 text-purple-300" />;
      case 'Verified Auditor':
        return <Award className="w-4 h-4 text-cyan-300" />;
      case 'Cadet Critic':
        return <ShieldCheck className="w-4 h-4 text-emerald-300" />;
      default:
        return <Ear className="w-4 h-4 text-zinc-300" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-xl transition-all">
      {/* Top Banner: Production Stamp & 24h Limits Tracker */}
      <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 px-4 py-1.5 border-b border-zinc-800/60 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
            <Flame className="w-3 h-3 text-amber-400" />
            AN INDIEBROTHERHOOD PRODUCTION • 2026
          </span>
          <span className="hidden md:inline text-zinc-500 text-[11px]">|</span>
          <span className="hidden md:inline text-zinc-400 text-[11px]">
            Unanimous Anonymous Peer Music Judgement Platform
          </span>
        </div>

        {/* Live 24h Quota and Skips Indicator */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-900/90 px-2.5 py-0.5 rounded-lg border border-zinc-800">
            <Gavel className="w-3 h-3 text-amber-400" />
            <span>Review credits:</span>
            <strong className="text-amber-400">{userProfile.judgementCredits}</strong>
            <span className="text-zinc-500">(3 needed)</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-900/90 px-2.5 py-0.5 rounded-lg border border-zinc-800">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>24h Quota:</span>
            <strong className={userProfile.dailyAuditsRemaining > 3 ? 'text-emerald-400' : 'text-amber-400'}>
              {userProfile.dailyAuditsRemaining}/{userProfile.dailyAuditsMax} Audits
            </strong>
            <span className="text-zinc-500 text-[10px]">({resetTimer.formatted})</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-900/90 px-2.5 py-0.5 rounded-lg border border-zinc-800">
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Skips:</span>
            <strong className={userProfile.skipsRemaining > 0 ? 'text-amber-400' : 'text-rose-400'}>
              {userProfile.skipsRemaining}/3
            </strong>
          </div>
        </div>
      </div>

      {/* Main Navigation & Brand Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div
            onClick={() => onSelectTab('chamber')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Gavel className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white uppercase group-hover:text-amber-400 transition font-sans">
                  Judgement Zone
                </h1>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-amber-400 border border-amber-500/30">
                  2026 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono tracking-tight">
                Blind Peer Chambers • 10-Judge Consensus
              </p>
            </div>
          </div>

          {/* Mobile Judge Tier Trigger */}
          <button
            onClick={onOpenTiers}
            type="button"
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-400"
          >
            {getTierIcon(userProfile.judgeTier)}
            <span>{userProfile.judgeTier}</span>
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          <button
            id="nav-tab-chamber"
            onClick={() => onSelectTab('chamber')}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'chamber'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Judgement Chamber</span>
            {queuedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'chamber' ? 'bg-amber-950 text-amber-300' : 'bg-amber-500 text-zinc-950'
              }`}>
                {queuedCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-submit"
            onClick={() => onSelectTab('submit')}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'submit'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Submit Track</span>
          </button>

          <button
            id="nav-tab-dossier"
            onClick={() => onSelectTab('dossier')}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'dossier'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80'
            }`}
          >
            <FileBarChart className="w-3.5 h-3.5" />
            <span>Artist Dossier</span>
          </button>

          <button
            id="nav-tab-vault"
            onClick={() => onSelectTab('vault')}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>My Vault ({userProfile.savedVaultTrackIds.length})</span>
          </button>

          <button
            id="nav-tab-sonic"
            onClick={() => onSelectTab('sonic')}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'sonic'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sonic Drift</span>
          </button>
        </nav>

        {/* Right Action: Judge Tier & Reputation Hub */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            id="header-judge-tier-btn"
            onClick={onOpenTiers}
            type="button"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left transition group cursor-pointer"
            title="Click to view Auditor Hierarchy & Multipliers"
          >
            <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition">
              {getTierIcon(userProfile.judgeTier)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                  {userProfile.judgeTier}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {tierData.multiplier}x
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <span>{userProfile.judgeXp} XP</span>
                <span>•</span>
                <span className="text-emerald-400">{userProfile.reputationScore}% Rep</span>
              </div>
            </div>
          </button>

          <button
            id="header-terms-btn"
            onClick={onOpenTerms}
            type="button"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition text-xs flex items-center gap-1 font-mono"
            title="IndieBrotherhood 2026 Terms of Service & Privacy"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline text-[11px]">TOS & Legal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
