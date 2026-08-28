import React, { useState, useEffect } from 'react';
import { Sparkles, Dice5, AlertTriangle, Award, ShieldCheck, Zap, Mic2 } from 'lucide-react';
import { Header } from './components/Header';
import { GenreSelector } from './components/GenreSelector';
import { VibeSelector } from './components/VibeSelector';
import { ExplicitToggle } from './components/ExplicitToggle';
import { ModeSelector } from './components/ModeSelector';
import { StructureSelector } from './components/StructureSelector';
import { LyricOutput } from './components/LyricOutput';
import { HelpSection } from './components/HelpSection';
import { TosModal } from './components/TosModal';
import { SavedHistoryModal } from './components/SavedHistoryModal';
import { GenerationDisclaimerModal } from './components/GenerationDisclaimerModal';
import { 
  GenreOption, 
  VibeOption, 
  CreationMode, 
  StarterSection, 
  UserLyricsOption,
  LyricSet, 
  LyricGenerateResponse, 
  SavedLyricEntry 
} from './types';
import { GENRE_STRUCTURES } from './data/structures';
import { generateAlgorithmicLyrics } from './data/lyricTemplates';
import { generateNativeLyrics } from '../../src/services/nativeBrowserAi';

export default function App() {
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

  // INITIAL LOAD FROM LOCAL STORAGE
  useEffect(() => {
    const tos = localStorage.getItem('lyric_pro_tos_accepted');
    if (tos === 'true') {
      setTosAccepted(true);
    } else {
      // Auto open TOS modal on first visit
      setIsTosOpen(true);
    }

    const saved = localStorage.getItem('lyric_pro_saved_vault');
    if (saved) {
      try {
        setSavedEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved vault:', e);
      }
    }
  }, []);

  // AUTO UPDATE DEFAULT STRUCTURE WHEN GENRE CHANGES
  useEffect(() => {
    const genreKey = customGenre && customGenre.trim() ? 'Other' : (GENRE_STRUCTURES[selectedGenre] ? selectedGenre : 'Hip-Hop');
    const available = GENRE_STRUCTURES[genreKey] || GENRE_STRUCTURES['Hip-Hop'];
    setStructure(available[0]);
  }, [selectedGenre, customGenre]);

  const handleAcceptTos = () => {
    setTosAccepted(true);
    localStorage.setItem('lyric_pro_tos_accepted', 'true');
  };

  // GENERATE LYRICS CALL
  const handleGenerate = async (isAutoMode = false) => {
    if (!tosAccepted) {
      setIsTosOpen(true);
      return;
    }

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
      const response = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      if (response.ok) {
        const data: LyricGenerateResponse = await response.json();
        setSetA(data.setA);
        setSetB(data.setB);
        setIsAiGenerated(data.isAiGenerated);
        return;
      }
    } catch (err) {
      console.debug('[Lyric Pro] Cloud API offline/keyless, trying native browser AI:', err);
    }

    try {
      // Step 2: Try Native Browser AI (Chrome Prompt API / Gemini Nano)
      const nativeResult = await generateNativeLyrics({
        genre: activeCustomGenre || activeGenre,
        vibe: activeCustomVibe || activeVibe,
        explicit,
        mode: isAutoMode ? 'full_song' : mode,
        structure,
        starterType,
        userLyrics,
        userLyricsOption,
      });

      if (nativeResult) {
        setSetA(nativeResult.setA);
        setSetB(nativeResult.setB);
        setIsAiGenerated(true);
        return;
      }
    } catch (browserAiErr) {
      console.debug('[Lyric Pro] Browser AI fallback to algorithmic:', browserAiErr);
    }

    // Step 3: High-precision client-side Algorithmic Lyric Synthesis (Zero-Cost, Keyless)
    try {
      const algoResult = generateAlgorithmicLyrics({
        genre: activeGenre,
        customGenre: activeCustomGenre,
        vibe: activeVibe,
        customVibe: activeCustomVibe,
        explicit,
        mode: isAutoMode ? 'full_song' : mode,
        starterType,
        structure,
        userLyrics,
        userLyricsOption
      });

      setSetA(algoResult.setA);
      setSetB(algoResult.setB);
      setIsAiGenerated(false);
    } catch (algoErr) {
      console.error('Lyrical synthesis error:', algoErr);
    } finally {
      setIsGenerating(false);
    }
  };

  // SAVE CURRENT DUAL SET TO VAULT
  const handleSaveBothSets = () => {
    if (!setA || !setB) return;

    const newEntry: SavedLyricEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      genre: customGenre || selectedGenre,
      vibe: customVibe || selectedVibe,
      explicit,
      mode,
      setA,
      setB
    };

    const updated = [newEntry, ...savedEntries];
    setSavedEntries(updated);
    localStorage.setItem('lyric_pro_saved_vault', JSON.stringify(updated));
    setCurrentEntrySaved(true);
  };

  const handleDeleteSavedEntry = (id: string) => {
    const updated = savedEntries.filter(e => e.id !== id);
    setSavedEntries(updated);
    localStorage.setItem('lyric_pro_saved_vault', JSON.stringify(updated));
  };

  const handleClearVault = () => {
    setSavedEntries([]);
    localStorage.removeItem('lyric_pro_saved_vault');
  };

  const handleLoadSavedEntry = (entry: SavedLyricEntry) => {
    setSetA(entry.setA);
    setSetB(entry.setB);
    setExplicit(entry.explicit);
    setMode(entry.mode);
    setCurrentEntrySaved(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-zinc-950 relative overflow-x-hidden">
      
      {/* 3D AMBIENT STUDIO LIGHTING BACKDROP */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.08),rgba(0,0,0,0))] studio-glow-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(circle_at_100%_100%,rgba(168,85,247,0.05),rgba(0,0,0,0))]" />
      </div>

      {/* HEADER */}
      <Header
        onOpenTos={() => setIsTosOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        tosAccepted={tosAccepted}
        historyCount={savedEntries.length}
      />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow relative z-10">
        
        {/* MOBILE LIVE SESSION INDICATOR BAR */}
        <div className="md:hidden mb-5 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 card-3d-depth flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 live-light-pulse" />
            <span className="text-[11px] font-black tracking-wider text-white uppercase font-mono">
              STUDIO SESSION LIVE
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            PRO ELITE V2.4
          </span>
        </div>

        {/* TOS ACCEPTANCE WARNING BANNER (IF NOT ACCEPTED) */}
        {!tosAccepted && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg card-3d-depth">
            <div className="flex items-center space-x-3 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Mandatory Legal Action Required:</strong> You must review and accept the Terms of Service & Immunity Waiver to unlock full lyric synthesis.
              </span>
            </div>
            <button
              onClick={() => setIsTosOpen(true)}
              className="px-4 py-2 bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-md hover:bg-amber-300 transition shrink-0 cursor-pointer"
            >
              Review & Accept Terms
            </button>
          </div>
        )}

        {/* WORKSPACE LAYOUT (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CONTROLS COLUMN (5 COLS) */}
          <div className="lg:col-span-5 space-y-6 bg-zinc-900/80 border border-zinc-800/80 p-5 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-md card-3d-depth">
            
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
                disabled={isGenerating}
                className="w-full py-4.5 sm:py-5 min-h-[56px] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_10px_25px_-3px_rgba(245,158,11,0.35),0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer border border-amber-300/40"
              >
                <Sparkles className="w-5 h-5 fill-zinc-950 stroke-zinc-950 shrink-0" />
                <span>GENERATE 2 LYRIC SETS (A & B)</span>
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
                disabled={isGenerating}
                className="w-full py-3.5 min-h-[48px] bg-zinc-900 border border-zinc-800 hover:border-amber-400/60 text-zinc-200 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md"
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
                <div className="text-[11px] font-black text-white uppercase tracking-wider">BEST LYRIC PRO</div>
                <div className="text-[10px] text-zinc-400 font-mono">SINCE 2026</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">EXPERT LYRICISM</div>
                <div className="text-[10px] text-zinc-400 font-mono">100% GUARANTEED</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Mic2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">DUAL OUTPUT</div>
                <div className="text-[10px] text-zinc-400 font-mono">CADENCE SYNTHESIS</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">100% LEGAL WAIVER</div>
                <div className="text-[10px] text-zinc-400 font-mono">PROTECTION ACTIVE</div>
              </div>
            </div>

          </div>

          {/* COPYRIGHT & TERMS LINKS */}
          <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-400">
            <p className="font-mono text-xs">
              2026 All rights reserved indiebrotherhood
            </p>

            <div className="flex items-center space-x-4 text-[11px]">
              <button onClick={() => setIsTosOpen(true)} className="hover:text-amber-400 transition font-medium">
                Terms of Service & Immunity Waiver
              </button>
              <span>•</span>
              <span className="text-zinc-500">Version 2.4 Pro Elite</span>
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
