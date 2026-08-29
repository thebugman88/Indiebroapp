import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTool } from './types';
import { Header } from './components/Header';
import { DashboardLauncher } from './components/DashboardLauncher';
import { LyricScratchpad } from './components/LyricScratchpad';
import { BpmCounter } from './components/BpmCounter';
import { KeyPitchFinder } from './components/KeyPitchFinder';
import { RhymeFinder } from './components/RhymeFinder';
import { MetadataHelper } from './components/MetadataHelper';
import { SplitSheetCalculator } from './components/SplitSheetCalculator';
import { GainNormalizer } from './components/GainNormalizer';
import { SmartLinkGenerator } from './components/SmartLinkGenerator';
import { BottomLookupDock } from './components/BottomLookupDock';

export default function App() {
  const parseToolFromHash = (): ActiveTool => {
    try {
      const raw = window.location.hash.replace(/^#\/?/, '');
      if (raw.startsWith('quick-tools/') || raw.startsWith('quicktools/')) {
        const sub = raw.split('/')[1] as ActiveTool;
        if (['dashboard', 'lyrics', 'bpm', 'pitch', 'rhymes', 'metadata', 'splits', 'gain', 'smartlink'].includes(sub)) {
          return sub;
        }
      }
      if (['lyrics', 'bpm', 'pitch', 'rhymes', 'metadata', 'splits', 'gain', 'smartlink'].includes(raw)) {
        return raw as ActiveTool;
      }
    } catch {}
    return 'dashboard';
  };

  const [activeTool, setActiveTool] = useState<ActiveTool>(parseToolFromHash);

  const [isAutoSaveOn, setIsAutoSaveOn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('indie_global_autosave');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(new Date());

  // Keep hash updated for browser back/forward and direct links
  const navigateTo = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
    window.location.hash = tool === 'dashboard' ? 'quick-tools' : `quick-tools/${tool}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseToolFromHash();
      setActiveTool(parsed);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut listener (1-8 on dashboard, Escape to go back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape' && activeTool !== 'dashboard') {
        e.preventDefault();
        navigateTo('dashboard');
        return;
      }

      if (activeTool === 'dashboard') {
        const keyToTool: Record<string, ActiveTool> = {
          '1': 'lyrics',
          '2': 'bpm',
          '3': 'pitch',
          '4': 'rhymes',
          '5': 'gain',
          '6': 'splits',
          '7': 'metadata',
          '8': 'smartlink',
        };
        if (keyToTool[e.key]) {
          e.preventDefault();
          navigateTo(keyToTool[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, navigateTo]);

  const handleToggleAutoSave = (val: boolean) => {
    setIsAutoSaveOn(val);
    try {
      localStorage.setItem('indie_global_autosave', JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white antialiased">
      {/* Persistent Minimal Header */}
      <Header
        activeTool={activeTool}
        onNavigate={navigateTo}
        lastSaved={lastSaved}
        isAutoSaveOn={isAutoSaveOn}
        onToggleAutoSave={handleToggleAutoSave}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-16">
        {activeTool === 'dashboard' && (
          <DashboardLauncher onSelectTool={navigateTo} />
        )}

        {activeTool === 'lyrics' && (
          <LyricScratchpad
            isAutoSaveOn={isAutoSaveOn}
            onToggleAutoSave={handleToggleAutoSave}
            lastSaved={lastSaved}
          />
        )}

        {activeTool === 'bpm' && (
          <BpmCounter
            isAutoSaveOn={isAutoSaveOn}
            lastSaved={lastSaved}
          />
        )}

        {activeTool === 'pitch' && (
          <KeyPitchFinder
            isAutoSaveOn={isAutoSaveOn}
          />
        )}

        {activeTool === 'rhymes' && (
          <RhymeFinder />
        )}

        {activeTool === 'metadata' && (
          <MetadataHelper
            isAutoSaveOn={isAutoSaveOn}
            lastSaved={lastSaved}
          />
        )}

        {activeTool === 'splits' && (
          <SplitSheetCalculator
            isAutoSaveOn={isAutoSaveOn}
            lastSaved={lastSaved}
          />
        )}

        {activeTool === 'gain' && (
          <GainNormalizer />
        )}

        {activeTool === 'smartlink' && (
          <SmartLinkGenerator
            isAutoSaveOn={isAutoSaveOn}
            lastSaved={lastSaved}
          />
        )}
      </main>

      {/* Global Persistent Bottom Dock (Sticky Lookup Bar across all views) */}
      <BottomLookupDock />
    </div>
  );
}
