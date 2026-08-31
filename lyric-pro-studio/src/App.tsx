import { retainLyricPairs } from '../../shared/lyricRetention';
import { flushPrivateStorage } from '../../shared/privateStorage';
import { currentPrivateStorage } from '../../shared/privateStorage';
import { createLyricVault } from './vault';
import { authenticatedFetch, getCurrentAuthUser } from '../../src/services/authService';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Dice5, 
  Mic2, 
  Award, 
  Zap, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  RefreshCw,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { Header } from './components/Header';
import { GenreSelector } from './components/GenreSelector';
import { VibeSelector } from './components/VibeSelector';
import { ModeSelector } from './components/ModeSelector';
import { StructureSelector } from './components/StructureSelector';
import { ExplicitToggle } from './components/ExplicitToggle';
import { LyricOutput } from './components/LyricOutput';
import { TosModal } from './components/TosModal';
import { SavedHistoryModal } from './components/SavedHistoryModal';
import { GenerationDisclaimerModal } from './components/GenerationDisclaimerModal';
import { HelpSection } from './components/HelpSection';
import { 
  GenreOption, 
  VibeOption, 
  CreationMode, 
  StarterSection, 
  UserLyricsOption, 
  LyricSet, 
  LyricGenerateResponse, 
  SavedLyricEntry,
  SecurityState 
} from './types';
import { GENRE_STRUCTURES } from './data/structures';



export default function App() {
  const [session, setSession] = useState(() => ({ uid: getCurrentAuthUser().id, revision: 0 }));
  useEffect(() => {
    const sync = () => {
      const uid = getCurrentAuthUser().id;
      setSession(old => uid === old.uid ? old : { uid, revision: old.revision + 1 });
    };
    window.addEventListener('ib_auth_changed', sync);
    sync();
    return () => window.removeEventListener('ib_auth_changed', sync);
  }, []);
  return <LyricStudio key={session.revision} accountId={session.uid} />;
}

function LyricStudio({ accountId }: { accountId: string }) {
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const isCurrentSession = () => active.current && getCurrentAuthUser().id === accountId;
  const vault = createLyricVault(accountId, () => getCurrentAuthUser().id, () => currentPrivateStorage());
  const [vaultError, setVaultError] = useState('');
  const [retentionNotice, setRetentionNotice] = useState(false);
  const [suppressNotice, setSuppressNotice] = useState(false);
  const generatedAt = useRef(0);
  // ACCOUNT & SECURITY SENTINEL STATE
  const [securityState, setSecurityState] = useState<SecurityState>({
    status: 'ACTIVE',
    trustScore: 100,
  });
  const [pauseCountdown, setPauseCountdown] = useState<number>(0);
  const [clickThrottleSeconds, setClickThrottleSeconds] = useState<number>(0);
  const lastClickTimeRef = useRef<number>(0);

  // APP STATE
  const [selectedGenre, setSelectedGenre] = useState<GenreOption>('Hip-Hop');
  const [customGenre, setCustomGenre] = useState<string>('');
  const [selectedVibe, setSelectedVibe] = useState<VibeOption>('Aggressive');
  const [customVibe, setCustomVibe] = useState<string>('');
  const [explicit, setExplicit] = useState<boolean>(false);
  const [mode, setMode] = useState<CreationMode>('full_song');
  const [starterType, setStarterType] = useState<StarterSection>('verse');
  const [structure, setStructure] = useState<string>(GENRE_STRUCTURES['Hip-Hop'][0]);
  const [userLyrics, setUserLyrics] = useState<string>('');
  const [userLyricsOption, setUserLyricsOption] = useState<UserLyricsOption>('finish_lyrics');

  // OUTPUT STATE
  const [setA, setSetA] = useState<LyricSet | null>(null);
  const [setB, setSetB] = useState<LyricSet | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // MODAL & SAVED HISTORY STATE
  const [isTosOpen, setIsTosOpen] = useState<boolean>(false);
  const [tosAccepted, setTosAccepted] = useState<boolean>(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const [pendingAutoMode, setPendingAutoMode] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [savedEntries, setSavedEntries] = useState<SavedLyricEntry[]>([]);
  const [currentEntrySaved, setCurrentEntrySaved] = useState<boolean>(false);

  // INITIAL LOAD & ACCOUNT INITIALIZATION
  useEffect(() => {
    // Never infer ownership from the old browser-wide vault or random account ID.
    try {
      setTosAccepted(vault.acceptedTerms());
      setIsTosOpen(!vault.acceptedTerms());
      setSavedEntries(vault.load());
    } catch {
      setVaultError('Browser storage is unavailable or damaged. Your vault could not be loaded.');
    }

    // 4. Fetch account security status from server
    authenticatedFetch('/api/security/account-status')
      .then((r) => r.json())
      .then((data) => {
        if (isCurrentSession() && data?.status) {
          setSecurityState({
            status: data.status.status || 'ACTIVE',
            pausedUntil: data.status.pausedUntil,
            pauseReason: data.status.pauseReason,
            trustScore: data.status.trustScore ?? 100,
          });
          if (data.status.status === 'PAUSED' && data.status.pausedUntil > Date.now()) {
            setPauseCountdown(Math.ceil((data.status.pausedUntil - Date.now()) / 1000));
          }
        }
      })
      .catch(() => {});
  }, []);

  // TICK DOWN PAUSE COUNTDOWN TIMER
  useEffect(() => {
    if (pauseCountdown <= 0) return;
    const timer = setInterval(() => {
      setPauseCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSecurityState((s) => ({ ...s, status: 'ACTIVE', pauseReason: '', pausedUntil: 0 }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pauseCountdown]);

  // TICK DOWN CLIENT-SIDE THROTTLE
  useEffect(() => {
    if (clickThrottleSeconds <= 0) return;
    const timer = setInterval(() => {
      setClickThrottleSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [clickThrottleSeconds]);

  // AUTO UPDATE DEFAULT STRUCTURE WHEN GENRE CHANGES
  useEffect(() => {
    const genreKey = customGenre && customGenre.trim() ? 'Other' : (GENRE_STRUCTURES[selectedGenre] ? selectedGenre : 'Hip-Hop');
    const available = GENRE_STRUCTURES[genreKey] || GENRE_STRUCTURES['Hip-Hop'];
    setStructure(available[0]);
  }, [selectedGenre, customGenre]);

  const handleAcceptTos = () => {
    setTosAccepted(true);
    try { vault.acceptTerms(); } catch { setVaultError('Guidelines accepted for this session only; browser storage is unavailable.'); }
  };

  // UNPAUSE ACCOUNT (REMEDIAL ACTION)
  const handleUnpause = async () => {
    try {
      const res = await authenticatedFetch('/api/security/unpause-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok && isCurrentSession()) {
        setPauseCountdown(0);
        setSecurityState({
          status: 'ACTIVE',
          pauseReason: '',
          pausedUntil: 0,
          trustScore: 100,
        });
      }
    } catch (e) {
      console.error('Failed to unpause:', e);
    }
  };

  // GENERATE LYRICS CALL
  const handleGenerate = async (isAutoMode = false) => {
    if (!tosAccepted) {
      setIsTosOpen(true);
      return;
    }

    // Check if account is currently paused
    if (securityState.status === 'PAUSED' && pauseCountdown > 0) {
      return;
    }

    // Anti-Bot: Check client-side rapid click hammering (under 1.5s)
    const now = Date.now();
    if (now - lastClickTimeRef.current < 1500) {
      setClickThrottleSeconds(2);
      return;
    }
    lastClickTimeRef.current = now;
    setClickThrottleSeconds(2);

    let activeGenre = selectedGenre;
    let activeCustomGenre = customGenre;
    let activeVibe = selectedVibe;
    let activeCustomVibe = customVibe;

    // If Auto Select mode or button was triggered, randomize genre & vibe
    if (isAutoMode || mode === 'auto') {
      const genres: GenreOption[] = ['Hip-Hop', 'Pop', 'R&B / Soul', 'Rock / Alt', 'Country', 'EDM / Dance', 'Trap', 'Indie'];
      const vibes: VibeOption[] = ['Energetic', 'Melancholic', 'Aggressive', 'Smooth', 'Trippy', 'Motivational', 'Dark', 'Euphoric'];
      
      activeGenre = genres[Math.floor(Math.random() * genres.length)];
      activeVibe = vibes[Math.floor(Math.random() * vibes.length)];
      activeCustomGenre = '';
      activeCustomVibe = '';

      setSelectedGenre(activeGenre);
      setSelectedVibe(activeVibe);
      setCustomGenre('');
      setCustomVibe('');
    }

    setIsGenerating(true);
    setCurrentEntrySaved(false);

    try {
      const response = await authenticatedFetch('/api/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          genre: activeGenre,
          customGenre: activeCustomGenre,
          vibe: activeVibe,
          customVibe: activeCustomVibe,
          explicit,
          mode: isAutoMode ? 'full_song' : mode,
          starterType,
          structure,
          autoRandomize: isAutoMode,
          userLyrics,
          userLyricsOption
        })
      });

      if (!isCurrentSession()) return;
      if (response.status === 429) {
        const errorData = await response.json();
        if (!isCurrentSession()) return;
        const remaining = errorData.remainingSeconds || 60;
        setSecurityState({
          status: 'PAUSED',
          pauseReason: errorData.pauseReason || errorData.error,
          pausedUntil: errorData.pausedUntil || Date.now() + remaining * 1000,
          trustScore: errorData.trustScore ?? 40,
        });
        setPauseCountdown(remaining);
        setIsGenerating(false);
        return;
      }

      if (response.ok) {
        const data: LyricGenerateResponse = await response.json();
        if (!isCurrentSession()) return;
        setSetA(data.setA);
        setSetB(data.setB);
        setIsAiGenerated(data.isAiGenerated);
        generatedAt.current = data.timestamp;
        const entry: SavedLyricEntry = {id: String(data.timestamp), timestamp:data.timestamp,genre:activeCustomGenre||activeGenre,vibe:activeCustomVibe||activeVibe,explicit,mode,setA:data.setA,setB:data.setB};
        const next = retainLyricPairs([entry,...vault.load()]);
        try { vault.save(next); await flushPrivateStorage(); if(!isCurrentSession())return; setSavedEntries(next);setCurrentEntrySaved(true);setVaultError(''); }
        catch { setVaultError('Lyrics are visible but could not be saved. Download both sets now.'); }
        setRetentionNotice(!vault.noticeSuppressed());
        if (data._telemetry?.trustScore !== undefined) {
          setSecurityState((s) => ({ ...s, trustScore: data._telemetry?.trustScore }));
        }
        setIsGenerating(false);
        return;
      }
    } catch { /* The server returns no unvalidated or recycled fallback. */ }
    if(isCurrentSession()) {setVaultError('Generation did not deliver two validated songs. Please try again.');setIsGenerating(false);}
  };

  useEffect(() => {
    const sweep = () => {
      try { setSavedEntries(vault.load()); } catch {}
      if(generatedAt.current && generatedAt.current + 86400000 <= Date.now()) {
        setSetA(null);setSetB(null);setCurrentEntrySaved(false);
      }
    };
    const timer=setInterval(sweep,30000);
    window.addEventListener('focus',sweep);
    return()=>{clearInterval(timer);window.removeEventListener('focus',sweep);};
  },[]);

  useEffect(()=>{
    if(!setA||!generatedAt.current)return;
    const timer=setTimeout(()=>{setSetA(null);setSetB(null);setCurrentEntrySaved(false);},Math.max(0,generatedAt.current+86400000-Date.now()));
    return()=>clearTimeout(timer);
  },[setA,setB]);

  useEffect(()=>{
    if(!savedEntries.length)return;
    const nextExpiry=Math.min(...savedEntries.map(entry=>entry.timestamp+86400000));
    const timer=setTimeout(()=>{try{setSavedEntries(vault.load());}catch{}},Math.max(0,nextExpiry-Date.now()));
    return()=>clearTimeout(timer);
  },[savedEntries]);

  // SAVE CURRENT DUAL SET TO VAULT
  const handleSaveBothSets = async () => {
    if (!setA || !setB) return;

    const newEntry: SavedLyricEntry = {
      id: String(generatedAt.current),
      timestamp: generatedAt.current,
      genre: customGenre || selectedGenre,
      vibe: customVibe || selectedVibe,
      explicit,
      mode,
      setA,
      setB
    };

    const updated = retainLyricPairs([newEntry, ...savedEntries]);
    if (!isCurrentSession()) return;
    try { vault.save(updated); await flushPrivateStorage(); } catch (error) {
      setVaultError(error instanceof Error ? error.message : 'Could not save this vault.');
      return;
    }
    setVaultError('');
    setSavedEntries(updated);
    setCurrentEntrySaved(true);
  };

  const handleDeleteSavedEntry = (id: string) => {
    const updated = savedEntries.filter(e => e.id !== id);
    if (!isCurrentSession()) return;
    try { vault.save(updated); } catch (error) {
      setVaultError(error instanceof Error ? error.message : 'Could not save this vault.');
      return;
    }
    setVaultError('');
    setSavedEntries(updated);
  };

  const handleClearVault = () => {
    if (!isCurrentSession()) return;
    try { vault.clear(); } catch { setVaultError('Could not clear this vault.'); return; }
    setVaultError('');
    setSavedEntries([]);
  };

  const handleLoadSavedEntry = (entry: SavedLyricEntry) => {
    if(!retainLyricPairs([entry]).length)return;
    generatedAt.current = entry.timestamp;
    setSetA(entry.setA);
    setSetB(entry.setB);
    setSelectedGenre(entry.genre as GenreOption);
    setSelectedVibe(entry.vibe as VibeOption);
    setExplicit(entry.explicit);
    setMode(entry.mode);
    setIsAiGenerated(true);
    setCurrentEntrySaved(true);
  };

  const isAccountPaused = securityState.status === 'PAUSED' && pauseCountdown > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950 relative overflow-x-hidden">
      {retentionNotice && <div role="dialog" aria-modal="true" aria-labelledby="retention-title" className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
        <div className="max-w-lg rounded-2xl bg-zinc-950 border border-amber-500 p-6 space-y-4 text-zinc-100">
          <h2 id="retention-title" className="font-bold text-lg">Download your songs now</h2>
          <p>Your encrypted temporary history keeps up to 10 songs (5 pairs), for at most 24 hours from generation. Older songs expire or are replaced sooner when the history fills. Downloads remain on your device; shared copies have their own lifetime.</p>
          <p className="text-sm">We check that the two sets differ and don’t repeat recent output. No automated check can guarantee copyright clearance; review before releasing.</p>
          <label className="flex gap-2"><input type="checkbox" checked={suppressNotice} onChange={e=>setSuppressNotice(e.target.checked)}/>Don’t show this reminder again for my account</label>
          <button className="bg-amber-400 text-black rounded px-4 py-2" onClick={()=>{if(suppressNotice){try{vault.suppressNotice();}catch{setVaultError('Reminder preference could not be saved.');}}setRetentionNotice(false);}}>Continue to downloads</button>
        </div>
      </div>}

      
      {/* 3D STUDIO LIGHTING / AMBIENT ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-3 text-sm text-zinc-300" role="status">
        {accountId === 'guest'
          ? 'Guest drafts are temporary and clear when you sign in or leave this tool. Copy them before switching; sign in before creating a saved vault.'
          : 'Your vault is saved for this account on this browser only. It is not a cloud backup.'}
        {' '}Older browser-wide drafts are preserved but are not automatically imported because their owner is unknown.
        {vaultError && <p role="alert" className="text-amber-300">{vaultError}</p>}
      </div>
      {/* HEADER */}
      <Header
        onOpenTos={() => setIsTosOpen(true)}
        onOpenHistory={() => {try{setSavedEntries(vault.load());}catch{setVaultError('History could not be loaded.');}setIsHistoryOpen(true);}}
        tosAccepted={tosAccepted}
        historyCount={savedEntries.length}
      />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow relative z-10">
        
        {/* SECURITY AI ACCOUNT PAUSED SHIELD BANNER */}
        {isAccountPaused && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-3d-depth">
            <div className="flex items-start space-x-3 text-rose-200">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Security AI Bot Sentinel: Account Temporarily Paused</span>
                  <span className="text-xs bg-rose-500 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                    {pauseCountdown}s remaining
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-1">
                  {securityState.pauseReason || 'Rapid excessive clicks or automated bot patterns detected. Cooldown enforced.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleUnpause}
                className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Standing</span>
              </button>
              <button
                onClick={() => setIsTosOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                View Rules
              </button>
            </div>
          </div>
        )}

        {/* TOS ACCEPTANCE WARNING BANNER (IF NOT ACCEPTED) */}
        {!tosAccepted && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg card-3d-depth">
            <div className="flex items-center space-x-3 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Startup Security Guidelines & Agreement Required:</strong> You must review and accept the Studio Rules & Anti-Bot Sentinel to unlock Gemini 3.7 lyric synthesis.
              </span>
            </div>
            <button
              onClick={() => setIsTosOpen(true)}
              className="px-4 py-2 bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-md hover:bg-amber-300 transition shrink-0 cursor-pointer"
            >
              Review & Accept Rules
            </button>
          </div>
        )}

        {/* WORKSPACE LAYOUT (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CONTROLS COLUMN (5 COLS) */}
          <div className="lg:col-span-5 space-y-6 bg-zinc-900/80 border border-zinc-800/80 p-5 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-md card-3d-depth">
            
            {/* LIVE SECURITY AI SENTINEL STATUS BADGE */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-zinc-200 font-mono">
                  SECURITY AI SENTINEL
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <span>Trust Score:</span>
                <span className={`font-bold ${securityState.trustScore && securityState.trustScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {securityState.trustScore ?? 100}%
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-amber-400 font-semibold">Gemini 3.7 Ghostwriter</span>
              </div>
            </div>

            <GenreSelector
              selectedGenre={selectedGenre}
              customGenre={customGenre}
              onSelectGenre={setSelectedGenre}
              onCustomGenreChange={setCustomGenre}
            />

            <VibeSelector
              selectedVibe={selectedVibe}
              customVibe={customVibe}
              onSelectVibe={setSelectedVibe}
              onCustomVibeChange={setCustomVibe}
            />

            <ModeSelector
              mode={mode}
              starterType={starterType}
              userLyrics={userLyrics}
              userLyricsOption={userLyricsOption}
              onSelectMode={setMode}
              onSelectStarterType={setStarterType}
              onUserLyricsChange={setUserLyrics}
              onUserLyricsOptionChange={setUserLyricsOption}
            />

            <StructureSelector
              selectedGenre={selectedGenre}
              customGenre={customGenre}
              selectedStructure={structure}
              onSelectStructure={setStructure}
            />

            <div className="my-2">
              <ExplicitToggle
                explicit={explicit}
                onToggleExplicit={setExplicit}
              />
            </div>

            {/* GENERATION TRIGGER BUTTONS */}
            <div className="pt-4 sm:pt-5 space-y-3.5">
              <button
                type="button"
                onClick={() => {
                  if (!tosAccepted) {
                    setIsTosOpen(true);
                    return;
                  }
                  setPendingAutoMode(false);
                  setIsDisclaimerOpen(true);
                }}
                disabled={isGenerating || isAccountPaused || clickThrottleSeconds > 0}
                className={`w-full py-4.5 sm:py-5 min-h-[56px] font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_10px_25px_-3px_rgba(245,158,11,0.35),0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer border ${
                  isAccountPaused
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 cursor-not-allowed'
                    : clickThrottleSeconds > 0
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 border-amber-300/40'
                }`}
              >
                {isAccountPaused ? (
                  <>
                    <Lock className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>ACCOUNT PAUSED ({pauseCountdown}s)</span>
                  </>
                ) : clickThrottleSeconds > 0 ? (
                  <>
                    <Clock className="w-5 h-5 text-zinc-400 animate-spin shrink-0" />
                    <span>PACING CADENCE ({clickThrottleSeconds}s)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-zinc-950 stroke-zinc-950 shrink-0" />
                    <span>GENERATE 2 LYRIC BLUEPRINTS (A & B)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!tosAccepted) {
                    setIsTosOpen(true);
                    return;
                  }
                  setPendingAutoMode(true);
                  setIsDisclaimerOpen(true);
                }}
                disabled={isGenerating || isAccountPaused || clickThrottleSeconds > 0}
                className="w-full py-3.5 min-h-[48px] bg-zinc-900 border border-zinc-800 hover:border-amber-400/60 text-zinc-200 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Dice5 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AUTO SELECT (RANDOMIZED LYRICS)</span>
              </button>
            </div>

          </div>

          {/* OUTPUT COLUMN (7 COLS) */}
          <div className="lg:col-span-7">
            <LyricOutput
              setA={setA}
              setB={setB}
              isAiGenerated={isAiGenerated}
              isGenerating={isGenerating}
              onSaveToFavorites={handleSaveBothSets}
              isSaved={currentEntrySaved}
            />
          </div>

        </div>

        {/* HELP & SYSTEM EXPLAINER SECTION */}
        <HelpSection />

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-8 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          
          {/* 4 FANCY EMBLEMS / BADGES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">ELITE GHOSTWRITER</div>
                <div className="text-[10px] text-zinc-400 font-mono">GEMINI 3.7 POWERED</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">METRICAL PROSODY</div>
                <div className="text-[10px] text-zinc-400 font-mono">SYLLABLES & RHYMES</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Mic2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">DUAL OUTPUT TAKES</div>
                <div className="text-[10px] text-zinc-400 font-mono">PRIMARY & ALTERNATE</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">SECURITY AI SENTINEL</div>
                <div className="text-[10px] text-zinc-400 font-mono">ANTI-BOT DEFENSE ACTIVE</div>
              </div>
            </div>

          </div>

          {/* COPYRIGHT & TERMS LINKS */}
          <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-400">
            <p className="font-mono text-xs">
              2026 All rights reserved indiebrotherhood
            </p>

            <div className="flex items-center space-x-4 text-[11px]">
              <button onClick={() => setIsTosOpen(true)} className="hover:text-amber-400 transition font-medium cursor-pointer">
                Startup Rules & Security Agreement
              </button>
              <span>•</span>
              <span className="text-zinc-500">Lyric Pro Studio Elite</span>
            </div>
          </div>

        </div>
      </footer>

      {/* MODALS */}
      <GenerationDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        onConfirm={() => handleGenerate(pendingAutoMode)}
        genre={customGenre || selectedGenre}
        vibe={customVibe || selectedVibe}
        explicit={explicit}
      />

      <TosModal
        isOpen={isTosOpen}
        onClose={() => setIsTosOpen(false)}
        onAccept={handleAcceptTos}
        tosAccepted={tosAccepted}
      />

      <SavedHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedEntries={savedEntries}
        onSelectEntry={handleLoadSavedEntry}
        onDeleteEntry={handleDeleteSavedEntry}
        onClearAll={handleClearVault}
      />

    </div>
  );
}
