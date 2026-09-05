import { PlanAndCoins } from './PlanAndCoins';
import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Gavel,
  Zap,
  Flame,
  Radio,
  PenTool,
  Brain,
  Dna,
  Briefcase,
  Users,
  Database,
  ShieldCheck,
  Music,
  TrendingUp,
  Star,
  Quote,
  Check,
  X,
  Play,
  Layers,
  Award,
  Crown,
  HeartHandshake,
  Trophy
} from 'lucide-react';
import { SuiteAppId } from '../App';
import { useGamification } from '../context/GamificationContext';

interface LandingPageProps {
  onLaunchApp: (appId?: SuiteAppId) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);
  const { awardXP } = useGamification();

  const handleStartFree = () => {
    awardXP({
      amount: 50,
      actionTitle: 'Launched indiebrotherhood suite',
      sourceApp: 'Hub Welcome'
    });
    onLaunchApp('hub');
  };

  const handleSelectFeatureApp = (appId: SuiteAppId) => {
    awardXP({
      amount: 25,
      actionTitle: `Explored ${appId}`,
      sourceApp: 'Landing Feature Tour'
    });
    onLaunchApp(appId);
  };

  const FOUR_BIGGEST_FEATURES = [
    {
      id: 'judgement-zone' as SuiteAppId,
      title: 'Anti-Bias Blind Juror Chamber',
      subtitle: '10-Judge Consensus & Proof of Heat',
      description:
        'No more fake love from friends or pay-to-play curators. Submit tracks completely anonymously to a 10-judge peer panel. Real data, brutal honesty, and zero industry bias before you spend a dime on release promo.',
      icon: Gavel,
      badge: 'Peer Intelligence',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/40',
      accentColor: 'text-amber-400',
      perks: [
        '10-judge double-blind scoring system',
        'Anti-bias listener calibration algorithm',
        'Juror XP progression & credibility tiers',
        'Exportable heat reports for A&Rs & labels'
      ]
    },
    {
      id: 'hit-analyzer' as SuiteAppId,
      title: 'Multimodal Hit & Skip-Rate AI',
      subtitle: 'First 30-Second Retention Telemetry',
      description:
        'Powered by Gemini 2.5 audio intelligence. Pinpoints the exact millisecond listeners drop off, audits your mix balance, rates chorus punch, and generates viral hook predictions calibrated to 2026 streaming algorithms.',
      icon: Flame,
      badge: 'Acoustic Analytics',
      gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
      borderColor: 'border-rose-500/40',
      accentColor: 'text-rose-400',
      perks: [
        '0-30s hook retention & drop-off telemetry',
        'Streaming algorithm readiness score (0-100)',
        'Frequency clash & dynamic range check',
        'Comparative hit benchmark database'
      ]
    },
    {
      id: 'lyric-pro' as SuiteAppId,
      title: 'Dual-Cadence Songwriting Matrix',
      subtitle: 'Micro-Cadence & Syllable Stress Tech',
      description:
        'Stop staring at a blank screen or switching between 5 rhyme websites. Built-in syllable stress mapping, multi-rhyme phonetics engine, dynamic flow meters, and AI cadence generators built specifically for rhythm-driven writers.',
      icon: PenTool,
      badge: 'Composition Lab',
      gradient: 'from-indigo-500/20 via-cyan-500/10 to-transparent',
      borderColor: 'border-indigo-500/40',
      accentColor: 'text-indigo-400',
      perks: [
        'Real-time syllable counting & meter lock',
        'Multi-syllabic slant rhyme dictionary',
        'AI hook continuation & flow suggestions',
        'Audio sync scratchpad with vocal recorder'
      ]
    },
    {
      id: 'royaltyops' as SuiteAppId,
      title: 'Full-Spectrum Royalty & Split Ops',
      subtitle: 'Instant OCR Split Sheets & PRO Sync',
      description:
        'Independent music business without the $500/hr lawyer. Scan lyric sheets or agreements via OCR, calculate publisher/writer splits automatically, generate ISRC-ready metadata, and protect your royalties forever.',
      icon: Database,
      badge: 'Business Operations',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/40',
      accentColor: 'text-emerald-400',
      perks: [
        'Instant OCR split sheet generator',
        'ISRC & PRO registration metadata packager',
        'Multi-collaborator signature workflows',
        'Zero-commission contract templates'
      ]
    }
  ];

  const TESTIMONIALS = [
    {
      quote:
        'I cancelled four separate $15 subscriptions the week I started using indiebrotherhood. The Judgement Zone alone saved me from pressing up 1,000 vinyls of a single that wasn’t ready.',
      name: 'Marcus "V-808" Rivera',
      role: 'Self-Released Producer & Sound Designer',
      genre: 'Trap & Cinematic',
      avatar: '🎧',
      highlight: 'Saved $60/month immediately'
    },
    {
      quote:
        'Most music tools feel like they were made by corporate techies who never touched a microphone. indiebrotherhood feels like being in a 3 AM studio session with an entire label staff in your laptop.',
      name: 'Maya Chen',
      role: 'Indie Pop Singer-Songwriter',
      genre: 'Alt-Pop / Indie R&B',
      avatar: '🎙️',
      highlight: 'Built for real recording workflows'
    },
    {
      quote:
        'Having split sheets, ISRC extraction, cadence metering, and peer reviews unified under one $14.99 login is the biggest cheat code in independent music right now.',
      name: 'Tre Styles',
      role: 'Independent Hip-Hop Artist & MC',
      genre: 'Boom Bap & Drill',
      avatar: '⚡',
      highlight: 'The $14.99 plan is unbeatable'
    },
    {
      quote:
        'The Hit Analyzer gave me retention data that my distributor’s dashboard couldn’t even dream of showing. Fixed my intro length and our Spotify editorial pick up jumped 4x.',
      name: 'Elena Rostova',
      role: 'Sync Supervisor & Mixing Engineer',
      genre: 'Electronic & Sync',
      avatar: '🎹',
      highlight: 'Actionable algorithmic insights'
    }
  ];

  const COMPARISONS = [
    {
      feature: 'Blind Peer Feedback (10-Judge Panel)',
      others: 'Ask friends who say "it\'s fire bro" or pay $50/song on submission sites',
      indiebrotherhood: 'Built-in 10-Judge Blind Consensus with Anti-Bias Algorithm & XP'
    },
    {
      feature: 'Songwriting & Rhyme Tools',
      others: '3 different ad-heavy tabs (Rhymezone, RapPad, SyllableCounter)',
      indiebrotherhood: 'Dual-Cadence Lyric Pro Studio with live syllable meters & AI scratchpad'
    },
    {
      feature: 'Acoustic & Hit Retention Analytics',
      others: 'Vague post-release charts after you already wasted money on promotion',
      indiebrotherhood: 'Pre-release 0-30s hook retention, frequency clash & skip predictor'
    },
    {
      feature: 'Split Sheets & Royalty Contracts',
      others: '$20/month legal template sites or paper split sheets lost in Google Drive',
      indiebrotherhood: 'One-click OCR Split Sheets, ISRC extraction & PRO-ready metadata'
    },
    {
      feature: 'Community & Cypher Collaboration',
      others: 'Cluttered Discord servers with dead voice channels and spam',
      indiebrotherhood: 'Integrated Hangout Cypher Rooms, Sonic IQ Quizzes & Board Governance'
    },
    {
      feature: 'Total Monthly Cost',
      others: '$120 - $180 / month across 8-10 fragmented subscriptions',
      indiebrotherhood: '100% Free Forever or $14.99 / month for Pro Powerhouse'
    }
  ];

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 overflow-hidden border-b border-zinc-800/80">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-rose-500/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-0 right-10 w-72 h-72 bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          {/* Catchphrase Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono shadow-xl backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-bold tracking-wide uppercase">Simplifying the Hustle • The Dawn of a New Era</span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Why pay for <span className="text-zinc-500 line-through decoration-rose-500/80">10 different apps</span>{' '}
              when you can master music in{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
                one unified OS?
              </span>
            </h1>
            <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Built from scratch by independent artists who got sick of spending $150/month on scattered lyric finders,
              fake-friend feedback, confusing split sheets, and guesswork analytics.
            </p>
          </div>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={handleStartFree}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-zinc-950 font-extrabold text-base shadow-xl shadow-amber-500/20 hover:opacity-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Launch Free Workspace</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#pricing"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-700/80 text-zinc-200 font-bold text-base hover:text-white transition flex items-center justify-center gap-2"
            >
              <span>See Free vs. $14.99 Plan</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </a>
          </div>

          {/* Zero-B.S. Credibility Markers */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-300">0% Cut of Royalties</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-2.5">
              <Gavel className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-300">10-Judge Blind Panels</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-300">Gemini 2.5 Audio AI</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-2.5">
              <Trophy className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-zinc-300">Gamified Creator XP</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE MANIFESTO: NOT JUST ANOTHER APP */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#080b12] border-b border-zinc-800/80">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-amber-400">
              The Independent Artist Dilemma
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Why this isn't "just another app" created to take your money
            </h3>
            <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
              The industry is flooded with disconnected point solutions charging $10–$30 every single month for basic
              tools. Here is how indiebrotherhood changes the game forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <X className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-white">The Old Way (Fragmented Chaos)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Opening 8 separate browser tabs, juggling passwords, losing paper split sheets, listening to biased
                feedback, and paying $150+ monthly for tools that don't even talk to each other.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/40 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-zinc-950 font-mono text-[10px] font-extrabold rounded-bl-xl">
                OUR SOLUTION
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-white">The indiebrotherhood OS</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Ten synchronized studios in one lightning-fast interface. Write, test with 10 blind judges, analyze
                skip rates, manage split sheets, and earn creator XP under one single hood.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-white">Artist-First Economics</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We believe working artists shouldn't be drained by high subscription fees. A comprehensive Free Tier for
                everyone, and an all-inclusive Pro power plan for just $14.99 / month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4 STANDOUT POWERHOUSE FEATURE CARDS */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-amber-400">
              Core Architectural Pillars
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">Four Game-Changing Engines You Won’t Find Anywhere Else</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
              Each module is crafted with deep functional depth, real mathematical acoustic logic, and direct creator workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FOUR_BIGGEST_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className={`p-6 sm:p-8 rounded-3xl bg-[#0b0e17] border ${feat.borderColor} shadow-2xl relative flex flex-col justify-between group transition-all hover:translate-y-[-2px]`}
                >
                  <div className="space-y-4">
                    {/* Top Tag & Number */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${feat.accentColor}`} />
                        <span>{feat.badge}</span>
                      </span>
                      <span className="text-xs font-mono text-zinc-600 font-bold">PILLAR 0{idx + 1}</span>
                    </div>

                    {/* Header */}
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                        {feat.title}
                      </h3>
                      <p className={`text-xs font-mono font-semibold ${feat.accentColor} mt-0.5`}>{feat.subtitle}</p>
                    </div>

                    {/* Body */}
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{feat.description}</p>

                    {/* Perks List */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                      {feat.perks.map((perk, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${feat.accentColor} flex-shrink-0`} />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Launch Button */}
                  <div className="pt-6 mt-4">
                    <button
                      onClick={() => handleSelectFeatureApp(feat.id)}
                      className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>Open {feat.title.split(' ')[0]} Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SIDE-BY-SIDE BREAKDOWN: 10 APPS VS. INDIEBROTHERHOOD */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#080b12] border-b border-zinc-800/80">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-amber-400">
              The Reality Check
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Stop Paying $150/Month for Fragmented Plugins
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-xs sm:text-sm">
              See what happens when your lyric writer, peer judges, audio analyzer, and contract split sheet live in one
              ecosystem.
            </p>
          </div>

          <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl bg-zinc-950/60">
            <div className="grid grid-cols-12 bg-zinc-900/90 border-b border-zinc-800 p-4 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              <div className="col-span-12 sm:col-span-3">Workflow Need</div>
              <div className="col-span-12 sm:col-span-4 text-rose-400 hidden sm:block">The 10 Disconnected Apps</div>
              <div className="col-span-12 sm:col-span-5 text-amber-400 hidden sm:block">indiebrotherhood OS</div>
            </div>

            <div className="divide-y divide-zinc-850">
              {COMPARISONS.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-12 p-4 text-xs items-center gap-2 sm:gap-0 hover:bg-zinc-900/30 transition">
                  <div className="col-span-12 sm:col-span-3 font-bold text-white flex items-center gap-1.5">
                    <span>{row.feature}</span>
                  </div>

                  <div className="col-span-12 sm:col-span-4 text-zinc-400 sm:pr-4 flex items-start gap-1.5">
                    <span className="sm:hidden font-bold text-rose-400">Old Way:</span>
                    <span>{row.others}</span>
                  </div>

                  <div className="col-span-12 sm:col-span-5 text-amber-300 font-semibold flex items-start gap-1.5">
                    <span className="sm:hidden font-bold text-amber-400">indiebrotherhood:</span>
                    <span>{row.indiebrotherhood}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUOTES & TESTIMONIALS */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-amber-400">
              Praised by Creators in the Trenches
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Trusted by Real Producers, MCs, and Songwriters
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-xs sm:text-sm">
              Read how independent creators are simplifying their hustle and leveling up their discography.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-[#0d101a] border border-zinc-800/90 shadow-xl flex flex-col justify-between space-y-4 relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {t.highlight}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/80">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{t.name}</h4>
                    <p className="text-[11px] text-zinc-400 font-medium">{t.role} • <span className="text-amber-400/80">{t.genre}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 px-6 bg-zinc-950"><div className="max-w-4xl mx-auto"><PlanAndCoins compact /></div></section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Simplifying the Hustle.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
              The Dawn of a New Era.
            </span>
          </h2>

          <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Stop switching between 10 tabs and burning cash on bloated subscriptions. Enter the unified suite built for
            the independent hustle.
          </p>

          <div className="pt-2">
            <button
              onClick={handleStartFree}
              className="px-9 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-zinc-950 font-black text-base shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
            >
              <span>Enter the 10-Tool OS Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
