import { PrivateWorkspaceGate } from '../shared/PrivateWorkspaceGate';
import { PurchaseDialog } from './components/PurchaseDialog';
import React, { useState, useEffect, Suspense, useMemo } from 'react';
import {
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
  LayoutGrid,
  ChevronDown,
  Sparkles,
  Command,
  Search,
  ArrowRight,
  ShieldCheck,
  Music,
  CheckCircle2,
  Sliders,
  AudioWaveform,
  Activity,
  Layers,
  ArrowUpRight,
  HelpCircle,
  Home,
  X,
  Compass,
  Trophy,
  Award,
  Lock
} from 'lucide-react';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { ProfileBadge } from './components/ProfileBadge';
import { AchievementToast } from './components/AchievementToast';
import { GamificationModal } from './components/GamificationModal';
import { DailyQuestsWidget } from './components/DailyQuestsWidget';
import { AchievementGallery } from './components/AchievementGallery';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import {CommunityProgressPrompt,ReferralCenter} from './components/ReferralCenter';
import { ArtistProfilePage } from './components/ArtistProfilePage';
import { DirectMessagesModal } from './components/DirectMessagesModal';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { AdminControlRoomModal } from './components/AdminControlRoomModal';
import { grantUserXP } from './services/gamification';
import {
  getCurrentAuthUser,
  saveCurrentAuthUser,
  RegisteredUser,
  ADMIN_EMAIL,
} from './services/authService';
import { getUnreadDmCount } from './services/dmService';
import { canMountMasteringSuite } from './masteringSuiteAccess';
import { MessageSquare, Crown } from 'lucide-react';

// Lazy load sub-applications for high-speed switching and performance
const JudgementZoneApp = React.lazy(() => import('../judgement-zone/src/App'));
const QuickToolsApp = React.lazy(() => import('../quick-tools-by-indiebrotherhood/src/App'));
const HitAnalyzerApp = React.lazy(() => import('../hit-analyzer_-built-by-indiebrotherhood/src/App'));
const HangOutApp = React.lazy(() => import('../hang-out/src/App'));
const LyricProStudioApp = React.lazy(() => import('../lyric-pro-studio/src/App'));
const LyricProQuizStudioApp = React.lazy(() => import('../lyric-pro-quiz-studio/src/App'));
const SemanticLabApp = React.lazy(() => import('../indiebrotherhood-semantic-lab/src/App'));
const ArtistAssistantApp = React.lazy(() => import('../indiebrotherhood-artist-assistant/src/App'));
const MeetingRoomApp = React.lazy(() => import('../meeting-room/src/App'));
const RoyaltyExtractorApp = React.lazy(() => import('../royalty-and-isrc-metadata-extractor/src/App'));
const MasteringSuiteApp = React.lazy(() => import('../mastering-suite/src/App'));

export type SuiteAppId =
  | 'landing'
  | 'hub'
  | 'artist-profile'
  | 'judgement-zone'
  | 'quick-tools'
  | 'hit-analyzer'
  | 'hang-out'
  | 'lyric-pro'
  | 'sonic-iq'
  | 'semantic-lab'
  | 'artist-assistant'
  | 'meeting-room'
  | 'mastering-suite'
  | 'royaltyops';

interface AppMeta {
  id: SuiteAppId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: 'Intelligence' | 'Creation' | 'Operations' | 'Community';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
  shortcut: string;
  features: string[];
}

const APPS: AppMeta[] = [
  {
    id: 'judgement-zone',
    name: 'Judgement Zone',
    shortName: 'Judgement',
    tagline: 'Blind peer-review chamber with 10-judge consensus, XP levels, and anti-bias guard',
    description: 'Submit your unreleased songs or beats for completely anonymous peer-review ratings. Level up your reviewer XP, unlock juror tiers, and eliminate industry bias.',
    category: 'Intelligence',
    icon: Gavel,
    color: 'from-amber-500 to-orange-600',
    badge: '10-Judge Chamber',
    shortcut: '1',
    features: ['Blind Audio Submission', '10-Judge Peer Voting', 'Reviewer XP & Badges', 'Anti-Bias Algorithm']
  },
  {
    id: 'quick-tools',
    name: 'Quick Tools',
    shortName: 'Quick Tools',
    tagline: 'Instant BPM counter, key pitch finder, rhyme dictionary, gain normalizer, and split sheets',
    description: 'Eight essential studio utilities designed for rapid production workflows — tap tempo, pitch detector, multi-syllable rhyme finder, audio gain normalizer, and smart link generator.',
    category: 'Creation',
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    badge: '8 Utilities in 1',
    shortcut: '2',
    features: ['BPM Tap Counter', 'Key & Pitch Detector', 'Rhyme Dictionary', 'Split Sheet Calculator']
  },
  {
    id: 'hit-analyzer',
    name: 'Hit Analyzer',
    shortName: 'Hit Analyzer',
    tagline: 'Multimodal 2026 streaming algorithm predictor & audio hit potential auditor',
    description: 'Upload audio demos to measure TikTok/Reels hook velocity, Spotify skip rate vulnerability, Apple Music Dolby loudness dynamics, and lyrical cadence impact.',
    category: 'Intelligence',
    icon: Flame,
    color: 'from-rose-500 to-red-600',
    badge: 'Multimodal AI',
    shortcut: '3',
    features: ['Hook Velocity Audit', 'Skip Rate Prediction', 'Vocal Quality Score', 'Dynamic Mix Insights']
  },
  {
    id: 'hang-out',
    name: 'Hang Out',
    shortName: 'Hang Out',
    tagline: 'Live real-time artist hub, multiplayer rap battle arenas, and genre cypher rooms',
    description: 'Join live cypher rooms, drop bars in real-time rap battle arenas evaluated by AI battle judges or community votes, and network with independent creators.',
    category: 'Community',
    icon: Radio,
    color: 'from-blue-500 to-indigo-600',
    badge: 'Real-Time Arena',
    shortcut: '4',
    features: ['Live Battle Arenas', 'AI Battle Judge Engine', 'Real-Time Cyphers', 'Artist Networking']
  },
  {
    id: 'lyric-pro',
    name: 'Lyric Pro Studio',
    shortName: 'Lyric Pro',
    tagline: 'Songwriting powerhouse with dual-set generation, cadence flows, and rhyme schemes',
    description: 'Generate two contrasting lyrical directions simultaneously based on genre, mood, and explicit options. Analyze rhyming structure and syllable cadences.',
    category: 'Creation',
    icon: PenTool,
    color: 'from-purple-500 to-pink-600',
    badge: 'Dual-Set AI',
    shortcut: '5',
    features: ['Dual-Set Generation', 'Cadence Flow Meter', 'Multi-Genre Matrix', 'Algorithmic Fallback']
  },
  {
    id: 'sonic-iq',
    name: 'Sonic IQ Lab',
    shortName: 'Sonic IQ',
    tagline: 'Lyric quiz studio featuring finish-the-song challenges, artist trivia, and music puzzles',
    description: 'Test your musical ear and lyrical memory with finish-the-line challenges, artist discography quizzes, and customizable genre trivia battles.',
    category: 'Creation',
    icon: Brain,
    color: 'from-cyan-500 to-blue-600',
    badge: 'Gamified Audio',
    shortcut: '6',
    features: ['Finish The Song', "Guess The Artist", 'Trivia Creator', 'Live Score Tracking']
  },
  {
    id: 'semantic-lab',
    name: 'Semantic Lab',
    shortName: 'Semantic Lab',
    tagline: 'ERA Synthesis engine analyzing lyric cadence flow matrix and cultural resonance',
    description: 'Deep semantic and phonological breakdown of lyrical themes, metaphor density, emotion vectors, and historical musical era synthesis.',
    category: 'Intelligence',
    icon: Dna,
    color: 'from-teal-500 to-emerald-600',
    badge: 'Cadence Engine',
    shortcut: '7',
    features: ['ERA Synthesis', 'Cadence Flow Matrix', 'Phonetic Mapping', 'Thematic Scoring']
  },
  {
    id: 'artist-assistant',
    name: 'Artist Assistant',
    shortName: 'Artist OS',
    tagline: 'Career operating system, song catalogue, document OCR, and release scheduler',
    description: 'Comprehensive music business organizer — catalogue manager, release timeline scheduler, contract scanner with OCR, and marketing campaign planner.',
    category: 'Operations',
    icon: Briefcase,
    color: 'from-indigo-500 to-violet-600',
    badge: 'Career OS',
    shortcut: '8',
    features: ['Catalogue Management', 'Contract OCR Scanner', 'Release Timeline', 'Export Suite']
  },
  {
    id: 'meeting-room',
    name: 'Meeting Room',
    shortName: 'Assembly',
    tagline: 'Parliamentary meeting assembly with live motions, voting tallies, and structured agendas',
    description: 'Run democratic artist collective meetings and record label board sessions with formal motions, seconding, roll-call voting, and downloadable minutes.',
    category: 'Operations',
    icon: Users,
    color: 'from-amber-600 to-yellow-600',
    badge: 'Live Motions',
    shortcut: '9',
    features: ['Parliamentary Motions', 'Live Quorum & Voting', 'Interactive Agendas', 'Meeting Minutes Export']
  },
  {
    id: 'mastering-suite',
    name: 'Mastering Suite',
    shortName: 'Mastering',
    tagline: 'Browser-local mastering controls with 24-bit and 16-bit WAV export',
    description: 'Load supported audio into volatile browser memory, adjust the mastering chain, edit optional release metadata, and export a WAV without uploading the session.',
    category: 'Creation',
    icon: AudioWaveform,
    color: 'from-amber-500 to-yellow-600',
    badge: 'Free • 0 Coins',
    shortcut: 'M',
    features: ['Browser-Local Processing', 'WAV 24-Bit Export', 'WAV 16-Bit Export', 'No Server Uploads']
  },
  {
    id: 'royaltyops',
    name: 'RoyaltyOps',
    shortName: 'RoyaltyOps',
    tagline: 'ISRC metadata extractor, PRO statement parser, OCR inspector, and split manager',
    description: 'Parse Performing Rights Organization statements, extract ISRC codes from cue sheets, calculate publishing splits, and inspect document metadata with OCR.',
    category: 'Operations',
    icon: Database,
    color: 'from-fuchsia-500 to-rose-600',
    badge: 'PRO & ISRC',
    shortcut: '0',
    features: ['PRO Statement Parser', 'ISRC Extractor', 'Split Sheet Manager', 'OCR Metadata Inspector']
  }
];

const WORKFLOWS = [
  {
    title: 'New Track Production & Validation',
    steps: [
      { app: 'quick-tools', label: '1. Set BPM & Key' },
      { app: 'lyric-pro', label: '2. Generate Dual Lyrics' },
      { app: 'hit-analyzer', label: '3. Test Hit Score' },
      { app: 'judgement-zone', label: '4. Blind Peer Review' }
    ]
  },
  {
    title: 'Business, Splits & Catalog Release',
    steps: [
      { app: 'royaltyops', label: '1. Extract ISRC & Splits' },
      { app: 'artist-assistant', label: '2. Catalogue & Release OS' },
      { app: 'meeting-room', label: '3. Collective Board Vote' },
      { app: 'hang-out', label: '4. Live Cypher Launch' }
    ]
  }
];

export function resolveSuiteApp(rawInput: string): SuiteAppId | null {
  if (!rawInput) return null;
  const clean = rawInput.replace(/^#\/?/, '').trim().toLowerCase();

  if (['landing', 'pricing', 'manifesto', 'why-us', 'home'].includes(clean)) return 'landing';
  if (['hub', 'dashboard', 'overview', 'master-hub'].includes(clean)) return 'hub';
  if (['artist-profile', 'artist', 'profile', 'catalog', 'artist-os', 'artist-environment'].includes(clean)) return 'artist-profile';
  if (['hang-out', 'hangout', 'hangout-app', 'cypher', 'rap-battle'].includes(clean) || clean.startsWith('hang-out') || clean.startsWith('hangout')) return 'hang-out';
  if (['quick-tools', 'quicktools', 'tools', 'bpm', 'pitch', 'rhymes', 'metadata', 'splits', 'gain', 'smartlink'].includes(clean) || clean.startsWith('quick-tools') || clean.startsWith('quicktools')) return 'quick-tools';
  if (['judgement-zone', 'judgementzone', 'judgement', 'jury', 'judge'].includes(clean) || clean.startsWith('judgement-zone') || clean.startsWith('judgementzone')) return 'judgement-zone';
  if (['hit-analyzer', 'hitanalyzer', 'analyzer', 'hit'].includes(clean) || clean.startsWith('hit-analyzer') || clean.startsWith('hitanalyzer')) return 'hit-analyzer';
  if (['lyric-pro', 'lyricpro', 'lyrics', 'lyric-pro-studio'].includes(clean) || clean.startsWith('lyric-pro') || clean.startsWith('lyricpro')) return 'lyric-pro';
  if (['sonic-iq', 'soniciq', 'quiz', 'trivia'].includes(clean) || clean.startsWith('sonic-iq') || clean.startsWith('soniciq')) return 'sonic-iq';
  if (['semantic-lab', 'semanticlab', 'semantic'].includes(clean) || clean.startsWith('semantic-lab') || clean.startsWith('semanticlab')) return 'semantic-lab';
  if (['artist-assistant', 'artistassistant', 'assistant'].includes(clean) || clean.startsWith('artist-assistant') || clean.startsWith('artistassistant')) return 'artist-assistant';
  if (['meeting-room', 'meetingroom', 'assembly', 'meeting'].includes(clean) || clean.startsWith('meeting-room') || clean.startsWith('meetingroom')) return 'meeting-room';
  if (['mastering-suite', 'masteringsuite', 'mastering'].includes(clean) || clean.startsWith('mastering-suite') || clean.startsWith('masteringsuite')) return 'mastering-suite';
  if (['royaltyops', 'royalty-ops', 'royalty', 'isrc'].includes(clean) || clean.startsWith('royaltyops') || clean.startsWith('royalty-ops')) return 'royaltyops';

  const exact = APPS.find((a) => a.id.toLowerCase() === clean);
  if (exact) return exact.id;

  return null;
}

function SuiteApp() {
  const [activeApp, setActiveApp] = useState<SuiteAppId>(() => {
    try {
      const resolved = resolveSuiteApp(window.location.hash);
      if (resolved) return resolved;
    } catch {
      // ignore
    }
    return 'landing';
  });

  const [currentUser, setCurrentUser] = useState<RegisteredUser>(getCurrentAuthUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isReferralOpen,setIsReferralOpen]=useState(false);
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [isAdminControlRoomOpen, setIsAdminControlRoomOpen] = useState(false);
  const [unreadDms, setUnreadDms] = useState<number>(0);

  const isMasterAdmin = currentUser.isAdmin === true;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { awardXP, setIsProfileModalOpen } = useGamification();

  // Sync Unread DMs and Auth changes
  useEffect(() => {
    setCurrentUser(getCurrentAuthUser());
    setUnreadDms(getUnreadDmCount(currentUser.id));

    const handleAuthChange = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
        setUnreadDms(getUnreadDmCount(e.detail.id));
      }
    };

    const handleDmChange = () => {
      setUnreadDms(getUnreadDmCount(currentUser.id));
    };

    window.addEventListener('ib_auth_changed', handleAuthChange);
    window.addEventListener('ib_dm_updated', handleDmChange);

    return () => {
      window.removeEventListener('ib_auth_changed', handleAuthChange);
      window.removeEventListener('ib_dm_updated', handleDmChange);
    };
  }, [currentUser.id]);

  // Sync Hash & Instant Scroll Reset for Perfect Traction
  const navigateTo = (appId: SuiteAppId | string) => {
    const resolved = resolveSuiteApp(appId) || (appId as SuiteAppId) || 'hub';
    setActiveApp(resolved);
    window.location.hash = resolved === 'landing' ? 'landing' : resolved === 'hub' ? 'hub' : resolved;
    setIsMenuOpen(false);
    setIsPaletteOpen(false);
    setSearchQuery('');
    // Instant scroll to top to prevent ghost height/scroll lag
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  // Ensure scroll traction resets instantly whenever activeApp changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeApp]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const resolved = resolveSuiteApp(hash);
      if (resolved) {
        setActiveApp(resolved);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut listener (Cmd/Ctrl + K or Alt + 0-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsMenuOpen(false);
        return;
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.altKey) {
        const found = APPS.find((a) => a.shortcut === e.key);
        if (found) {
          e.preventDefault();
          navigateTo(found.id);
        } else if (e.key === 'h' || e.key === '`') {
          e.preventDefault();
          navigateTo('hub');
        } else if (e.key === 'p') {
          e.preventDefault();
          setIsProfileModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsProfileModalOpen]);

  const filteredApps = useMemo(() => {
    return APPS.filter((app) => {
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const paletteResults = useMemo(() => {
    if (!searchQuery.trim()) return APPS;
    const q = searchQuery.toLowerCase();
    return APPS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.features.some((f) => f.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const currentMeta = APPS.find((a) => a.id === activeApp);

  // Workflow step handler with XP rewards
  const handleWorkflowStepClick = (stepApp: string, stepLabel: string) => {
    navigateTo(stepApp as SuiteAppId);
    awardXP({
      amount: 25,
      actionTitle: `Pipeline Step: ${stepLabel}`,
      sourceApp: 'Production Pipeline'
    });
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
      {/* 1. MASTER TOP SUITE DOCK */}
      <header className="sticky top-0 z-50 bg-[#0a0d14]/95 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 xl:px-6 min-h-14 flex items-center justify-between gap-2 sm:gap-3 overflow-hidden">
          {/* Logo & Suite Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => navigateTo('landing')}
              className="flex items-center gap-2 hover:opacity-90 transition group text-left cursor-pointer"
              title="View Manifesto & Pricing"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-[1px] shadow-lg shadow-amber-500/20 flex-shrink-0">
                <div className="w-full h-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold tracking-tight text-white text-xs sm:text-sm">INDIEBROTHERHOOD</span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                    OS
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium hidden md:block">10-Studio Intelligence Suite</p>
              </div>
            </button>
          </div>

          {/* Suite Right Controls: Command Search, Universal Profile Badge & App Menu */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0 overflow-x-auto scrollbar-none">
            {/* Live Universal Notification Center */}
            <NotificationCenter onNavigateTo={(app) => navigateTo(app as SuiteAppId)} />

            {/* Direct Messages Trigger */}
            <button
              onClick={() => setIsDmModalOpen(true)}
              className="relative p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
              title="Artist Direct Messages & Audio Voice Notes"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadDms > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-slate-950">
                  {unreadDms}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden lg:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 items-center gap-2 transition cursor-pointer"
              title="Command Palette (Cmd + K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden xl:inline font-sans">Search...</span>
              <kbd className="hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                ⌘K
              </kbd>
            </button>

            {/* UNIVERSAL PERSISTENT PROFILE & XP COMPONENT */}
            <div onClick={() => navigateTo('artist-profile')} className="hidden xl:block cursor-pointer">
              <ProfileBadge />
            </div>

            {/* Founder Christopher Ray Exclusive Admin Control Room Button */}
            {isMasterAdmin && (
              <button
                type="button"
                id="suite-master-admin-control-room-btn"
                onClick={() => setIsAdminControlRoomOpen(true)}
                className="hidden lg:flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black border border-amber-300 shadow-md shadow-amber-500/20 text-xs items-center gap-1.5 cursor-pointer transition transform hover:scale-[1.02] active:scale-95"
                title="Founder Admin Control Room: Real User Logs, Live Kick/Whitelist/Blacklist & Universal Announcements"
              >
                <Crown className="w-4 h-4 text-zinc-950 fill-zinc-950" />
                <span className="font-extrabold tracking-tight">Admin Room</span>
              </button>
            )}

            {/* Login / Profile Switcher Button */}
            {currentUser.id!=='guest'&&<button onClick={()=>setIsReferralOpen(true)} className="hidden lg:block rounded-xl border border-amber-500/30 px-2 py-1.5 text-xs font-bold text-amber-300 whitespace-nowrap" title="Profile completion and verified referral rewards">Invite & Earn</button>}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                currentUser.isAdmin
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-amber-500/40'
              }`}
              title={currentUser.isAdmin ? 'Verified administrator' : 'Sign In / Recover Account'}
            >
              {currentUser.isAdmin ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-[11px]">Christopher Ray</span>
                </>
              ) : (
                <span className="text-[11px] px-1">Login</span>
              )}
            </button>

            {/* App Switcher Dropdown Trigger */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium flex items-center gap-1 sm:gap-1.5 text-zinc-200 shadow-sm transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {currentMeta ? (
                  <>
                    <currentMeta.icon className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white hidden sm:inline">{currentMeta.shortName}</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white hidden sm:inline">10 Studios</span>
                  </>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {currentUser.id !== 'guest' && (
          <div className="lg:hidden border-t border-zinc-800/70 bg-zinc-950/95 px-3 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button type="button" onClick={() => navigateTo('artist-profile')} className="shrink-0 rounded-lg border border-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-200">My Profile</button>
            <button type="button" onClick={() => setIsReferralOpen(true)} className="shrink-0 rounded-lg border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300">Invite & Earn</button>
            {isMasterAdmin && <button type="button" onClick={() => setIsAdminControlRoomOpen(true)} className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-black text-zinc-950">Admin Room</button>}
          </div>
        )}

        {/* Dedicated Horizontal Scrolling Studio Navigation Ribbon */}
        <div className="border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur px-3 sm:px-6 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs font-medium">
          <button
            onClick={() => navigateTo('landing')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeApp === 'landing'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why Us & Pricing</span>
          </button>

          <button
            onClick={() => navigateTo('hub')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeApp === 'hub'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Master Hub</span>
          </button>

          <button
            onClick={() => navigateTo('artist-profile')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeApp === 'artist-profile'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-zinc-950 font-bold shadow-sm'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-zinc-900'
            }`}
            title="Artist Environment & Catalog"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Artist Catalog & OS</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1 flex-shrink-0" />

          {APPS.map((app) => {
            const Icon = app.icon;
            const isSelected = activeApp === app.id;
            return (
              <button
                key={app.id}
                onClick={() => navigateTo(app.id)}
                className={`px-2.5 py-1 rounded-lg items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'flex bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                    : 'hidden 2xl:flex text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
                title={`${app.name} (Alt+${app.shortcut})`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{app.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdown Menu of All 10 Applications */}
        {isMenuOpen && (
          <div className="border-t border-zinc-800 bg-[#0b0e17] px-4 py-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-3">
                <span className="font-mono uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Switch to Studio Application
                </span>
                <span className="font-mono text-[11px] hidden sm:inline text-zinc-500">Shortcut: Alt + [0-9] | Profile: Alt + P</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <button
                  onClick={() => navigateTo('landing')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeApp === 'landing'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Intro</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Why Us & Pricing</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">Manifesto & $14.99 Pro</p>
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('hub')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeApp === 'hub'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Alt+H</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Master Hub</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">Suite overview & launcher</p>
                  </div>
                </button>

                {APPS.map((app) => {
                  const Icon = app.icon;
                  const isSelected = activeApp === app.id;
                  return (
                    <button
                      key={app.id}
                      onClick={() => navigateTo(app.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${app.color} text-white flex items-center justify-center shadow-md`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-amber-400">
                          Alt+{app.shortcut}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-white">{app.name}</h4>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{app.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* COMMAND PALETTE MODAL (CMD + K) */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-20 animate-in fade-in duration-100">
          <div className="bg-[#0e121c] border border-zinc-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-zinc-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type an app name, feature, or keyword..."
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <button
                onClick={() => navigateTo('landing')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-800/80 flex items-center justify-between text-zinc-200 group transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Why indiebrotherhood (Manifesto & $14.99 Pro)</p>
                    <p className="text-[11px] text-zinc-400">The story, 4 pillar features, and transparent pricing</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-amber-400">Story</span>
              </button>

              <button
                onClick={() => navigateTo('hub')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-800/80 flex items-center justify-between text-zinc-200 group transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Master Hub & Overview</p>
                    <p className="text-[11px] text-zinc-400">Launchpad for the complete 10-app ecosystem</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-amber-400">Alt+H</span>
              </button>

              {paletteResults.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => navigateTo(app.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-800/80 flex items-center justify-between text-zinc-200 group transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${app.color} text-white flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{app.name}</p>
                        <p className="text-[11px] text-zinc-400 leading-snug">{app.tagline}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-amber-400">Alt+{app.shortcut}</span>
                  </button>
                );
              })}

              {paletteResults.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No tools found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Navigate: Arrows or Click</span>
              <span>Select: Enter | Close: Esc</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE APPLICATION VIEWPORT */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Floating Quick Return to Hub (Shown when inside any sub-studio) */}
        {activeApp !== 'hub' && activeApp !== 'landing' && (
          <aside aria-label="Quick Hub Return" className="fixed bottom-5 right-5 z-40">
            <button
              onClick={() => navigateTo('hub')}
              className="px-3.5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 shadow-2xl flex items-center gap-2 transition-all hover:scale-105 backdrop-blur-md group cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
              <span>Back to Main Hub</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Alt+H
              </kbd>
            </button>
          </aside>
        )}

        {currentUser.id!=='guest'&&['hub','artist-profile'].includes(activeApp)&&<CommunityProgressPrompt key={currentUser.id} onOpen={()=>setIsReferralOpen(true)}/>}
        <PrivateWorkspaceGate><Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-3 font-mono">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-amber-400 font-semibold tracking-wider">
                  Booting {currentMeta?.name || 'Workspace App'}...
                </p>
              </div>
            </div>
          }
        >
          {/* 0. LANDING PAGE & MANIFESTO */}
          {activeApp === 'landing' && <LandingPage onLaunchApp={(appId) => navigateTo(appId || 'hub')} />}

          {/* MASTER HUB OVERVIEW */}
          {activeApp === 'hub' && (
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
              {/* Hero Banner & Live System Health */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 to-[#0c0f18] border border-zinc-800 p-6 sm:p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>indiebrotherhood UNIFIED SUITE • 2026 EDITION</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>All 11 Studios Active & Synced</span>
                    </div>
                  </div>

                  <div className="max-w-3xl space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                      The Unified Operating System for Independent Music
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                      Eleven integrated intelligence tools, creation studios, business operations platforms, and community spaces — unified with creator XP progression.
                    </p>
                  </div>

                  {/* Quick Stat Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <p className="text-[11px] font-mono text-zinc-400 uppercase">Total Tools</p>
                      <p className="text-xl font-extrabold text-white mt-0.5">11 Studios</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <p className="text-[11px] font-mono text-zinc-400 uppercase">AI Audio Models</p>
                      <p className="text-xl font-extrabold text-amber-400 mt-0.5">Gemini 2.5</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <p className="text-[11px] font-mono text-zinc-400 uppercase">Progression Engine</p>
                      <p className="text-xl font-extrabold text-emerald-400 mt-0.5">10 Ranks & XP</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <p className="text-[11px] font-mono text-zinc-400 uppercase">Metadata Engine</p>
                      <p className="text-xl font-extrabold text-purple-400 mt-0.5">ISRC + OCR</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DAILY QUESTS & CREATIVE STREAK BOARD */}
              <DailyQuestsWidget onNavigateToApp={(appId) => navigateTo(appId as SuiteAppId)} />

              {/* Recommended Creator Workflows */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>Recommended Production Pipelines (+Bonus XP)</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {WORKFLOWS.map((wf, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        {wf.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {wf.steps.map((st, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleWorkflowStepClick(st.app, st.label)}
                            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-left text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-between transition group cursor-pointer"
                          >
                            <span>{st.label}</span>
                            <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Filter & Search Bar */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs font-medium">
                    {['All', 'Intelligence', 'Creation', 'Operations', 'Community'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter 10 tools or features..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Grid of All 10 Applications */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <div
                        key={app.id}
                        onClick={() => navigateTo(app.id)}
                        className="group relative bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-500/5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${app.color} text-white flex items-center justify-center shadow-lg flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700/80 font-semibold whitespace-nowrap">
                              {app.badge}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                                {app.name}
                              </h3>
                            </div>
                            <p className="text-[11px] font-mono text-amber-400/80 mt-1 leading-snug">
                              {app.tagline}
                            </p>
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-normal">
                              {app.description}
                            </p>
                          </div>

                          {/* Key Feature Chips */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {app.features.map((f, fIdx) => (
                              <span
                                key={fIdx}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800/80"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                          <span className="text-[11px] text-zinc-400 uppercase tracking-wider">{app.category}</span>
                          <span className="group-hover:translate-x-1 transition-transform font-bold text-amber-400 flex items-center gap-1">
                            Launch Studio →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. MASTER HUB TROPHY ROOM & BADGE GALLERY */}
              <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                <AchievementGallery maxItems={6} showFilters={true} />
              </div>
            </main>
          )}

          {/* ARTIST ENVIRONMENT & VERIFIED SONG CATALOG OS */}
          {activeApp === 'artist-profile' && (
            <ArtistProfilePage
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onNavigateToApp={(appId) => navigateTo(appId as SuiteAppId)}
            />
          )}

          {/* 1. JUDGEMENT ZONE */}
          {activeApp === 'judgement-zone' && <JudgementZoneApp />}

          {/* 2. QUICK TOOLS */}
          {activeApp === 'quick-tools' && <QuickToolsApp />}

          {/* 3. HIT ANALYZER */}
          {activeApp === 'hit-analyzer' && <HitAnalyzerApp />}

          {/* 4. HANG OUT */}
          {activeApp === 'hang-out' && <HangOutApp />}

          {/* 5. LYRIC PRO STUDIO */}
          {activeApp === 'lyric-pro' && <LyricProStudioApp />}

          {/* 6. SONIC IQ LAB */}
          {activeApp === 'sonic-iq' && <LyricProQuizStudioApp />}

          {/* 7. SEMANTIC LAB */}
          {activeApp === 'semantic-lab' && <SemanticLabApp />}

          {/* 8. ARTIST ASSISTANT */}
          {activeApp === 'artist-assistant' && <ArtistAssistantApp />}

          {/* 9. MEETING ROOM */}
          {activeApp === 'meeting-room' && <MeetingRoomApp />}

          {/* Mastering sessions require a real account and remount on identity changes. */}
          {activeApp === 'mastering-suite' && (
            canMountMasteringSuite(currentUser.id) ? (
              <MasteringSuiteApp key={currentUser.id} />
            ) : (
              <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
                <Lock className="h-10 w-10 text-amber-400" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-bold text-white">Sign in to use Mastering Suite</h2>
                  <p className="mt-2 max-w-md text-sm text-zinc-400">Audio sessions are isolated to the currently authenticated account and remain in this browser tab.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-400"
                >
                  Sign In
                </button>
              </div>
            )
          )}

          {/* 10. ROYALTYOPS */}
          {activeApp === 'royaltyops' && <RoyaltyExtractorApp />}
        </Suspense></PrivateWorkspaceGate>
      </div>

      {/* GLOBAL TOAST & MODAL OVERLAYS */}
      {isReferralOpen&&currentUser.id!=='guest'&&<PrivateWorkspaceGate><ReferralCenter onClose={()=>setIsReferralOpen(false)}/></PrivateWorkspaceGate>}
      <AchievementToast />
      <GamificationModal />
      <PurchaseDialog />
      <NotificationToastContainer onNavigateTo={(appId) => navigateTo(appId as SuiteAppId)} />

      {/* Founder Christopher Ray Admin Control Room Modal */}
      <AdminControlRoomModal
        isOpen={isAdminControlRoomOpen}
        onClose={() => setIsAdminControlRoomOpen(false)}
        currentUser={currentUser}
        onNavigateTo={(appId) => navigateTo(appId as SuiteAppId)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
      <DirectMessagesModal
        isOpen={isDmModalOpen}
        onClose={() => setIsDmModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <GamificationProvider>
      <SuiteApp />
    </GamificationProvider>
  );
}
