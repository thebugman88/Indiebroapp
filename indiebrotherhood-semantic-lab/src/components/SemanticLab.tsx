import { authenticatedFetch } from '../../../src/services/authService';
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Radio,
  Share2,
  Download,
  Info,
  ShieldCheck,
  Disc,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';

import { EngineMode, InputMode, EraPreset, SynthesisResult } from '../types';
import { EraTrajectoryChart } from './EraTrajectoryChart';
import { ModeControlsBar } from './ModeControlsBar';
import { SemanticProcessorTerminal } from './SemanticProcessorTerminal';
import { FlowMatrixView } from './FlowMatrixView';
import { HitPotentialPredictor } from './HitPotentialPredictor';
import { SystemHeuristicsHUD } from './SystemHeuristicsHUD';
import { playHudClick } from '../utils/audio';

export const SemanticLab: React.FC = () => {
  // Engine State
  const [engineMode, setEngineMode] = useState<EngineMode>('CLEAN');
  const [unleashedDrive, setUnleashedDrive] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<InputMode>('LYRIC_REFACTOR');
  const [eraPreset, setEraPreset] = useState<EraPreset>('NEO_CYBER_2026');
  const [bpm, setBpm] = useState<number>(140);
  const [inputText, setInputText] = useState<string>(
    `Stepping out the shadows with the frequency locked\nDigital adrenaline, the system never stopped\nWriting in the matrix where the algorithms bleed\nSonic independence is the only law we need`
  );

  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisData, setSynthesisData] = useState<SynthesisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FLOW_MATRIX' | 'HIT_PREDICTOR'>('ALL');
  const [synthesisCount, setSynthesisCount] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState('');
  // Full Write Synthesis Trigger
  const handleExecuteSynthesis = async () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    setErrorMessage('');
    setSynthesisData(null);
    playHudClick('synthesize');

    try {
      const response = await authenticatedFetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          engineMode,
          unleashedDrive,
          inputMode,
          eraPreset,
          bpm,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      if (result && result.data) {
        setSynthesisData(result.data);
        setSynthesisCount((prev) => prev + 1);
        playHudClick('success');

        // Confetti trigger for successful synthesis & secured IP registration
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#06b6d4', '#a855f7', '#10b981', '#f59e0b'],
          });
        } catch {
          // ignore if canvas not mounted
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Synthesis failed. No result was generated.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div id="semantic-lab-root" className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500 selection:text-zinc-950 pb-16">
      <p role="status" className="p-3 text-center text-amber-300">{errorMessage || 'Creative AI estimates only—not measured market data or a rights registration.'}</p>
      {/* Background Cyber Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top App Header / IndieBrotherhood Identity */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Disc className="w-5 h-5 text-cyan-400 animate-[spin_12s_linear_infinite]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-mono font-bold tracking-tight text-white uppercase flex items-center gap-2">
                  <span>INDIEBROTHERHOOD</span>
                  <span className="text-zinc-600 font-normal">/</span>
                  <span className="text-cyan-400">SEMANTIC LAB</span>
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  ERA SYNTHESIS ENGINE v5.0
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400">
                Next-Gen Lyric Refactoring, AI Flow Matrix & Creative Advisory
              </p>
            </div>
          </div>

          {/* Top Status Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400">STATUS:</span>
              <span className="text-emerald-400 font-bold">ONLINE & SECURED</span>
            </div>

            <a
              href="https://indiebrotherhood.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-colors"
            >
              <span>indiebrotherhood.com</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
        </header>

        {/* 1. Global ERA Trajectory & Analytics Chart */}
        <section aria-label="Global ERA Trajectory Analytics">
          <EraTrajectoryChart
            hasResult={!!synthesisData}
            peakProbability={synthesisData?.peakProbability || 0}
            sonicSaturation={synthesisData?.sonicSaturation || (unleashedDrive ? 'HIGH' : 'MEDIUM')}
            eraCompatibility={synthesisData?.eraCompatibility || 'OPTIMAL'}
            isSynthesizing={isSynthesizing}
            unleashedDrive={unleashedDrive}
          />
        </section>

        {/* 2. Mode Controls Bar (CLEAN vs UNLEASHED, UNLEASHED_DRIVE, BPM, ERA Presets) */}
        <section aria-label="Engine Mode Controls">
          <ModeControlsBar
            engineMode={engineMode}
            onEngineModeChange={setEngineMode}
            unleashedDrive={unleashedDrive}
            onUnleashedDriveChange={setUnleashedDrive}
            eraPreset={eraPreset}
            onEraPresetChange={setEraPreset}
            bpm={bpm}
            onBpmChange={setBpm}
          />
        </section>

        {/* 3. Enhanced Semantic Injection Terminal (Dual-Mode + Real-time Syllable & Rhyme Meter) */}
        <section aria-label="Semantic Injection Processor">
          <SemanticProcessorTerminal
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            inputText={inputText}
            onInputTextChange={setInputText}
            onExecuteSynthesis={handleExecuteSynthesis}
            isSynthesizing={isSynthesizing}
            engineMode={engineMode}
            unleashedDrive={unleashedDrive}
            bpm={bpm}
          />
        </section>

        {/* View Switcher Tabs (All, Flow Matrix, Hit Predictor, IP Registry) */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'ALL', label: 'Complete Matrix View' },
              { id: 'FLOW_MATRIX', label: 'AI Rhyme & Flow Matrix' },
              { id: 'HIT_PREDICTOR', label: 'Hit Potential Predictor' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playHudClick('subtle');
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
            Synthesis Iterations: <strong className="text-cyan-400">{synthesisCount}</strong>
          </span>
        </div>

        {/* Results Grid / Tabbed Content */}
        <div className="space-y-6">
          {/* AI Rhyme Scheme & Flow Matrix */}
          {(activeTab === 'ALL' || activeTab === 'FLOW_MATRIX') && (
            <section aria-label="AI Rhyme Scheme & Flow Matrix">
              <FlowMatrixView
                flowMatrix={synthesisData?.flowMatrix || null}
                isSynthesizing={isSynthesizing}
                synthesizedText={synthesisData?.synthesizedText || ''}
              />
            </section>
          )}

          {/* Smart Hook & Hit Potential Predictor */}
          {(activeTab === 'ALL' || activeTab === 'HIT_PREDICTOR') && (
            <section aria-label="Smart Hook & Hit Potential Predictor">
              <HitPotentialPredictor
                metrics={synthesisData?.metrics || null}
                peakProbability={synthesisData?.peakProbability || 0}
                suggestedChordsOrKey={synthesisData?.suggestedChordsOrKey}
                producerTips={synthesisData?.producerTips}
                isSynthesizing={isSynthesizing}
              />
            </section>
          )}

          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4" aria-label="Rights notice">
            <p className="text-xs text-amber-100/90">
              Creative analysis is advisory only. This tool does not register works, verify ownership, issue ISWCs, or submit material to ASCAP, MLC, or any royalty organization.
            </p>
          </section>
        </div>

        {/* 5. System Heuristics (Engine Health Telemetry) */}
        <section aria-label="System Heuristics">
          <SystemHeuristicsHUD
            engineMode={engineMode}
            unleashedDrive={unleashedDrive}
            isSynthesizing={isSynthesizing}
          />
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] font-mono text-zinc-600">
          <div className="flex items-center gap-2">
            <span>INDIEBROTHERHOOD SEMANTIC LAB (v5.0)</span>
            <span>•</span>
            <span>CREATIVE ANALYSIS ONLY</span>
          </div>
          <div className="flex items-center gap-3">
            <span>ERA SYNTHESIS ENGINE</span>
            <span>•</span>
            <span>ALL RIGHTS RESERVED TO ARTIST</span>
          </div>
        </footer>

      </div>
    </div>
  );
};
