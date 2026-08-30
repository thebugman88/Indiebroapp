import { authenticatedFetch } from '../../src/services/authService';
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioInputSection } from './components/AudioInputSection';
import { LyricSection } from './components/LyricSection';
import { LyricReminderModal } from './components/LyricReminderModal';
import { CopyrightGuardBar, CopyrightGuardRefusalCard } from './components/CopyrightGuardNotice';
import { AnalysisResults } from './components/AnalysisResults';
import { HelpTermsModal } from './components/HelpTermsModal';
import { Footer } from './components/Footer';
import { AnalysisResult } from './types';
import { Flame, Radio, Loader2, Sparkles, ArrowUpRight } from 'lucide-react';

export default function App() {
  // Audio state
  const [selectedAudioName, setSelectedAudioName] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'file' | 'url' | 'sample'>('file');
  const [mimeType, setMimeType] = useState<string>('audio/mp3');

  // Lyrics state
  const [lyrics, setLyrics] = useState<string>('');

  // Modals state
  const [showLyricReminder, setShowLyricReminder] = useState<boolean>(false);
  const [hideReminderPermanently, setHideReminderPermanently] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [helpModalTab, setHelpModalTab] = useState<'logic' | 'tos' | 'guide'>('logic');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing 2026 Hit Analysis...');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load persistent lyric reminder preference from localStorage
  useEffect(() => {
    const savedHidePref = localStorage.getItem('hit_analyzer_hide_lyric_reminder');
    if (savedHidePref === 'true') {
      setHideReminderPermanently(true);
    }
  }, []);

  const handleAudioSelected = (data: {
    audioName: string;
    artistName: string;
    audioData: string | null;
    audioUrl: string;
    inputMethod: 'file' | 'url' | 'sample';
    mimeType: string;
  }) => {
    setSelectedAudioName(data.audioName);
    setArtistName(data.artistName);
    setAudioData(data.audioData);
    setAudioUrl(data.audioUrl);
    setInputMethod(data.inputMethod);
    setMimeType(data.mimeType);
    setErrorMessage(null);
    setAnalysisResult(null);
  };

  const handleOpenHelp = (tab: 'logic' | 'tos' | 'guide' = 'logic') => {
    setHelpModalTab(tab);
    setHelpModalOpen(true);
  };

  const handleAnalyzeClick = () => {
    if (!audioData) {
      setErrorMessage('Please upload an audio file first. Track URLs and demo metadata cannot be measured on their own.');
      return;
    }

    setErrorMessage(null);

    // Check if lyrics are missing and reminder is active
    if (!lyrics.trim() && !hideReminderPermanently) {
      setShowLyricReminder(true);
      return;
    }

    runAnalysis();
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setErrorMessage(null);

    // Loading steps animation
    const steps = ['Uploading your audio…', 'Requesting AI listening feedback…', 'Preparing advisory results…'];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setLoadingStep(steps[stepIndex]);
    }, 900);

    try {
      const response = await authenticatedFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData,
          audioName: selectedAudioName || 'Untitled Song',
          artistName: artistName || 'Indie Artist',
          lyrics,
          inputMethod,
          mimeType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis is unavailable.');
      setAnalysisResult(data);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Analysis failed. No results were generated.');
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const handleDontShowAgainToggle = (dontShow: boolean) => {
    setHideReminderPermanently(dontShow);
    if (dontShow) {
      localStorage.setItem('hit_analyzer_hide_lyric_reminder', 'true');
    } else {
      localStorage.removeItem('hit_analyzer_hide_lyric_reminder');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      
      <p className="p-3 text-center text-xs text-amber-300">AI feedback is advisory. Scores are subjective, not measured streaming performance or a guarantee of success.</p>
        {/* Top Header */}
      <div>
        <Header onOpenHelp={handleOpenHelp} />

        {/* Hero Banner / Intro */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Cross-Platform Music Intelligence for Indie Artists
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-sans">
              Analyze Your Track's Hit Potential
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Upload your unreleased music or demo to evaluate vocal tone, tune, vibe, and hook strength against <strong className="text-slate-200">2026 TikTok, Spotify, Apple Music, and Billboard</strong> streaming algorithms.
            </p>
          </div>
        </div>

        {/* Main Application Body */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Error Alert */}
          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-xl text-rose-200 text-xs font-semibold flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-white underline font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* INPUT FORM SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 cols: Audio Source */}
            <div className="lg:col-span-7">
              <AudioInputSection
                selectedAudioName={selectedAudioName}
                artistName={artistName}
                audioData={audioData}
                audioUrl={audioUrl}
                inputMethod={inputMethod}
                mimeType={mimeType}
                onAudioSelected={handleAudioSelected}
                onLyricsSuggested={(sampleLyrics) => setLyrics(sampleLyrics)}
              />
            </div>

            {/* Right 5 cols: Lyrics */}
            <div className="lg:col-span-5">
              <LyricSection
                lyrics={lyrics}
                onChange={setLyrics}
                onOpenHelpModal={() => handleOpenHelp('logic')}
              />
            </div>

          </div>

          {/* Copyright Guard Bar */}
          <CopyrightGuardBar onOpenTerms={() => handleOpenHelp('tos')} />

          {/* ANALYZE BUTTON */}
          <div className="text-center pt-2">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleAnalyzeClick}
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-3 mx-auto ${
                isAnalyzing
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  <span>{loadingStep}</span>
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span>Analyze Hit Potential</span>
                  <ArrowUpRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* REFUSAL CARD (if song was detected as copyrighted/cover) */}
          {analysisResult && analysisResult.isCopyrightedOrCover && (
            <CopyrightGuardRefusalCard
              reason={analysisResult.copyrightReason}
              onReset={() => setAnalysisResult(null)}
              onOpenTerms={() => handleOpenHelp('tos')}
            />
          )}

          {/* RESULTS BREAKDOWN DISPLAY */}
          {analysisResult && !analysisResult.isCopyrightedOrCover && (
            <AnalysisResults
              result={analysisResult}
              songTitle={selectedAudioName || 'Untitled Song'}
              artistName={artistName || 'Indie Artist'}
              onReset={() => {
                setAnalysisResult(null);
                setSelectedAudioName('');
                setAudioData(null);
                setAudioUrl('');
              }}
              onOpenHelp={handleOpenHelp}
            />
          )}

        </main>
      </div>

      {/* FOOTER */}
      <Footer onOpenHelp={handleOpenHelp} />

      {/* MODALS */}
      <LyricReminderModal
        isOpen={showLyricReminder}
        onClose={() => setShowLyricReminder(false)}
        onAddLyrics={() => {
          setShowLyricReminder(false);
          const lyricElem = document.querySelector('textarea');
          if (lyricElem) lyricElem.focus();
        }}
        onProceedWithoutLyrics={() => {
          setShowLyricReminder(false);
          runAnalysis();
        }}
        onDontShowAgainToggle={handleDontShowAgainToggle}
      />

      <HelpTermsModal
        isOpen={helpModalOpen}
        initialTab={helpModalTab}
        onClose={() => setHelpModalOpen(false)}
      />

    </div>
  );
}
